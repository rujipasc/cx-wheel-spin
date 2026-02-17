export namespace main {
	
	export class ExportRow {
	    no: number;
	    name: string;
	    timestamp: string;
	
	    static createFrom(source: any = {}) {
	        return new ExportRow(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.no = source["no"];
	        this.name = source["name"];
	        this.timestamp = source["timestamp"];
	    }
	}
	export class FilePayload {
	    path: string;
	    name: string;
	    ext: string;
	    base64: string;
	
	    static createFrom(source: any = {}) {
	        return new FilePayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.ext = source["ext"];
	        this.base64 = source["base64"];
	    }
	}
	export class ImportPreviewPayload {
	    path: string;
	    name: string;
	    ext: string;
	    base64: string;
	    sheets: string[];
	    activeSheet: string;
	    columns: string[];
	    rows: string[][];
	    parseHint: string;
	
	    static createFrom(source: any = {}) {
	        return new ImportPreviewPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.ext = source["ext"];
	        this.base64 = source["base64"];
	        this.sheets = source["sheets"];
	        this.activeSheet = source["activeSheet"];
	        this.columns = source["columns"];
	        this.rows = source["rows"];
	        this.parseHint = source["parseHint"];
	    }
	}

}

