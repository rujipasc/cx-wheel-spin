package main

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/csv"
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

type FilePayload struct {
	Path   string `json:"path"`
	Name   string `json:"name"`
	Ext    string `json:"ext"`
	Base64 string `json:"base64"`
}

type ImportPreviewPayload struct {
	FilePayload
	Sheets    []string   `json:"sheets"`
	Active    string     `json:"activeSheet"`
	Columns   []string   `json:"columns"`
	Rows      [][]string `json:"rows"`
	ParseHint string     `json:"parseHint"`
}

type ExportRow struct {
	No        int    `json:"no"`
	Name      string `json:"name"`
	Timestamp string `json:"timestamp"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) PickImportFile() (*FilePayload, error) {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select CSV/XLSX file",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Data file",
				Pattern:     "*.csv;*.xlsx",
			},
		},
	})
	if err != nil {
		return nil, err
	}
	if path == "" {
		return nil, nil
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	return &FilePayload{
		Path:   path,
		Name:   filepath.Base(path),
		Ext:    filepath.Ext(path),
		Base64: base64.StdEncoding.EncodeToString(data),
	}, nil
}

func (a *App) PickImportPreview() (*ImportPreviewPayload, error) {
	file, err := a.PickImportFile()
	if err != nil || file == nil {
		return nil, err
	}

	data, err := base64.StdEncoding.DecodeString(file.Base64)
	if err != nil {
		return nil, err
	}

	payload := &ImportPreviewPayload{
		FilePayload: *file,
		Sheets:      []string{},
		Columns:     []string{},
		Rows:        [][]string{},
	}

	switch strings.ToLower(file.Ext) {
	case ".csv":
		rows, err := parseCSVBytes(data)
		if err != nil {
			return nil, err
		}
		payload.Rows = rows
		payload.Active = "CSV"
		payload.Sheets = []string{"CSV"}
		payload.Columns = firstRowOrDefault(rows)
		payload.ParseHint = "csv"
		return payload, nil
	case ".xlsx":
		sheets, active, rows, err := parseXLSXBytes(data)
		if err != nil {
			return nil, err
		}
		payload.Rows = rows
		payload.Active = active
		payload.Sheets = sheets
		payload.Columns = firstRowOrDefault(rows)
		payload.ParseHint = "xlsx-native"
		return payload, nil
	default:
		payload.ParseHint = "unsupported"
		return payload, nil
	}
}

func (a *App) SaveFileBase64(defaultName string, base64Data string) (string, error) {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save export file",
		DefaultFilename: defaultName,
	})
	if err != nil {
		return "", err
	}
	if path == "" {
		return "", nil
	}

	bytes, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", err
	}

	if err := os.WriteFile(path, bytes, 0644); err != nil {
		return "", err
	}
	return path, nil
}

func (a *App) SaveResultsXLSX(defaultName string, rows []ExportRow) (string, error) {
	if defaultName == "" {
		defaultName = "wheel-results.xlsx"
	}
	if !strings.HasSuffix(strings.ToLower(defaultName), ".xlsx") {
		defaultName = defaultName + ".xlsx"
	}

	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save XLSX export file",
		DefaultFilename: defaultName,
	})
	if err != nil {
		return "", err
	}
	if path == "" {
		return "", nil
	}

	xlsxBytes, err := buildResultsXLSX(rows)
	if err != nil {
		return "", err
	}

	if err := os.WriteFile(path, xlsxBytes, 0644); err != nil {
		return "", err
	}
	return path, nil
}

func parseCSVBytes(data []byte) ([][]string, error) {
	r := csv.NewReader(strings.NewReader(string(data)))
	r.FieldsPerRecord = -1
	rows, err := r.ReadAll()
	if err != nil {
		return nil, err
	}
	return rows, nil
}

type workbookXML struct {
	Sheets []struct {
		Name string `xml:"name,attr"`
		RID  string `xml:"http://schemas.openxmlformats.org/officeDocument/2006/relationships id,attr"`
	} `xml:"sheets>sheet"`
}

type workbookRelsXML struct {
	Relationships []struct {
		ID     string `xml:"Id,attr"`
		Target string `xml:"Target,attr"`
	} `xml:"Relationship"`
}

type sharedStringsXML struct {
	Items []struct {
		Text string `xml:"t"`
		Runs []struct {
			Text string `xml:"t"`
		} `xml:"r"`
	} `xml:"si"`
}

type worksheetXML struct {
	Rows []struct {
		Cells []struct {
			Ref    string `xml:"r,attr"`
			Type   string `xml:"t,attr"`
			Value  string `xml:"v"`
			Inline struct {
				Text string `xml:"t"`
			} `xml:"is"`
		} `xml:"c"`
	} `xml:"sheetData>row"`
}

func parseXLSXBytes(data []byte) ([]string, string, [][]string, error) {
	reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, "", nil, err
	}

	fileMap := map[string][]byte{}
	for _, f := range reader.File {
		rc, openErr := f.Open()
		if openErr != nil {
			return nil, "", nil, openErr
		}
		content, readErr := io.ReadAll(rc)
		rc.Close()
		if readErr != nil {
			return nil, "", nil, readErr
		}
		fileMap[f.Name] = content
	}

	var shared sharedStringsXML
	if sst, ok := fileMap["xl/sharedStrings.xml"]; ok {
		_ = xml.Unmarshal(sst, &shared)
	}
	sharedList := make([]string, 0, len(shared.Items))
	for _, si := range shared.Items {
		if si.Text != "" {
			sharedList = append(sharedList, si.Text)
			continue
		}
		var b strings.Builder
		for _, run := range si.Runs {
			b.WriteString(run.Text)
		}
		sharedList = append(sharedList, b.String())
	}

	var wb workbookXML
	if err := xml.Unmarshal(fileMap["xl/workbook.xml"], &wb); err != nil {
		return nil, "", nil, err
	}
	if len(wb.Sheets) == 0 {
		return nil, "", nil, fmt.Errorf("no sheet found")
	}

	var rels workbookRelsXML
	if err := xml.Unmarshal(fileMap["xl/_rels/workbook.xml.rels"], &rels); err != nil {
		return nil, "", nil, err
	}
	ridToTarget := map[string]string{}
	for _, rel := range rels.Relationships {
		ridToTarget[rel.ID] = rel.Target
	}

	sheetNames := make([]string, 0, len(wb.Sheets))
	for _, s := range wb.Sheets {
		sheetNames = append(sheetNames, s.Name)
	}

	firstSheet := wb.Sheets[0]
	target := ridToTarget[firstSheet.RID]
	target = strings.TrimPrefix(target, "/")
	if !strings.HasPrefix(target, "xl/") {
		target = filepath.ToSlash(filepath.Join("xl", target))
	}

	var ws worksheetXML
	if err := xml.Unmarshal(fileMap[target], &ws); err != nil {
		return nil, "", nil, err
	}

	rows := make([][]string, 0, len(ws.Rows))
	for _, r := range ws.Rows {
		maxCol := -1
		colPairs := make([]struct {
			Idx int
			Val string
		}, 0, len(r.Cells))
		for cellPos, c := range r.Cells {
			colIdx := colIndexFromRef(c.Ref)
			if colIdx < 0 {
				colIdx = cellPos
			}
			if colIdx > maxCol {
				maxCol = colIdx
			}
			colPairs = append(colPairs, struct {
				Idx int
				Val string
			}{
				Idx: colIdx,
				Val: resolveCellValue(c.Type, c.Value, c.Inline.Text, sharedList),
			})
		}
		if maxCol < 0 {
			rows = append(rows, []string{})
			continue
		}
		row := make([]string, maxCol+1)
		for _, pair := range colPairs {
			row[pair.Idx] = pair.Val
		}
		rows = append(rows, row)
	}

	return sheetNames, firstSheet.Name, rows, nil
}

func resolveCellValue(cellType, rawValue, inlineText string, shared []string) string {
	switch cellType {
	case "s":
		i, err := strconv.Atoi(rawValue)
		if err == nil && i >= 0 && i < len(shared) {
			return shared[i]
		}
		return ""
	case "inlineStr":
		return inlineText
	default:
		return rawValue
	}
}

func colIndexFromRef(ref string) int {
	if ref == "" {
		return -1
	}
	letters := make([]rune, 0, 4)
	for _, r := range ref {
		if unicode.IsDigit(r) {
			break
		}
		if unicode.IsLetter(r) {
			letters = append(letters, unicode.ToUpper(r))
		}
	}
	if len(letters) == 0 {
		return -1
	}
	index := 0
	for _, r := range letters {
		index = index*26 + int(r-'A'+1)
	}
	return index - 1
}

func firstRowOrDefault(rows [][]string) []string {
	if len(rows) == 0 {
		return []string{}
	}
	return rows[0]
}

func normalizeBase64(raw string) string {
	if raw == "" {
		return raw
	}
	parts := strings.Split(raw, ",")
	return parts[len(parts)-1]
}

func buildResultsXLSX(rows []ExportRow) ([]byte, error) {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	created := time.Now().UTC().Format(time.RFC3339)

	sheetXML := makeSheetXML(rows)

	contentTypes := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`

	rootRels := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`

	workbook := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Results" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`

	workbookRels := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

	styles := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`

	core := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Wheel Results</dc:title>
  <dc:creator>CardX HRIS</dc:creator>
  <cp:lastModifiedBy>CardX HRIS</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">` + created + `</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">` + created + `</dcterms:modified>
</cp:coreProperties>`

	app := `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>CardX HRIS Wheel</Application>
</Properties>`

	files := map[string][]byte{
		"[Content_Types].xml":        []byte(contentTypes),
		"_rels/.rels":                []byte(rootRels),
		"docProps/core.xml":          []byte(core),
		"docProps/app.xml":           []byte(app),
		"xl/workbook.xml":            []byte(workbook),
		"xl/_rels/workbook.xml.rels": []byte(workbookRels),
		"xl/styles.xml":              []byte(styles),
		"xl/worksheets/sheet1.xml":   []byte(sheetXML),
	}

	for path, content := range files {
		if err := writeZipFile(zw, path, content); err != nil {
			return nil, err
		}
	}

	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func writeZipFile(zw *zip.Writer, path string, content []byte) error {
	w, err := zw.Create(path)
	if err != nil {
		return err
	}
	_, err = w.Write(content)
	return err
}

func makeSheetXML(rows []ExportRow) string {
	startRow := 2
	lastRow := startRow + len(rows)
	if lastRow < startRow {
		lastRow = startRow
	}
	dimension := fmt.Sprintf("A1:C%d", lastRow)
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`)
	b.WriteString(`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`)
	b.WriteString(`<dimension ref="` + dimension + `"/>`)
	b.WriteString(`<sheetViews><sheetView workbookViewId="0"/></sheetViews>`)
	b.WriteString(`<sheetFormatPr defaultRowHeight="15"/>`)
	b.WriteString(`<cols><col min="1" max="1" width="10" customWidth="1"/><col min="2" max="2" width="34" customWidth="1"/><col min="3" max="3" width="24" customWidth="1"/></cols>`)
	b.WriteString(`<sheetData>`)

	writeInlineRow(&b, 1, []string{"No", "Name", "Timestamp"})

	for i, row := range rows {
		r := startRow + i
		b.WriteString(`<row r="` + strconv.Itoa(r) + `">`)
		b.WriteString(`<c r="A` + strconv.Itoa(r) + `"><v>` + strconv.Itoa(row.No) + `</v></c>`)
		b.WriteString(`<c r="B` + strconv.Itoa(r) + `" t="inlineStr"><is><t>` + xmlEscape(row.Name) + `</t></is></c>`)
		b.WriteString(`<c r="C` + strconv.Itoa(r) + `" t="inlineStr"><is><t>` + xmlEscape(row.Timestamp) + `</t></is></c>`)
		b.WriteString(`</row>`)
	}

	b.WriteString(`</sheetData>`)
	b.WriteString(`</worksheet>`)
	return b.String()
}

func writeInlineRow(b *strings.Builder, rowNum int, cols []string) {
	colRefs := []string{"A", "B", "C"}
	b.WriteString(`<row r="` + strconv.Itoa(rowNum) + `">`)
	for i := 0; i < 3; i++ {
		val := ""
		if i < len(cols) {
			val = cols[i]
		}
		ref := colRefs[i] + strconv.Itoa(rowNum)
		b.WriteString(`<c r="` + ref + `" t="inlineStr"><is><t>` + xmlEscape(val) + `</t></is></c>`)
	}
	b.WriteString(`</row>`)
}

func xmlEscape(input string) string {
	var b bytes.Buffer
	_ = xml.EscapeText(&b, []byte(input))
	return b.String()
}
