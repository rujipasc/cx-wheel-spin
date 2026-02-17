import { createContext, createElement, useContext, useMemo, useReducer } from "react";

const SessionContext = createContext(null);

function nowIsoLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function sanitizeNames(names, options) {
  const { trimWhitespace, ignoreBlankRows, deduplicate } = options;
  const normalized = names
    .map((raw) => (trimWhitespace ? String(raw ?? "").trim() : String(raw ?? "")))
    .filter((name) => (ignoreBlankRows ? name.length > 0 : true));

  if (!deduplicate) return normalized;

  const seen = new Set();
  const deduped = [];
  for (const name of normalized) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(name);
  }
  return deduped;
}

const initialState = {
  sourceFileName: "No file loaded",
  allNames: [],
  remainingNames: [],
  results: [],
  drawHistory: [],
  settings: {
    removeAfterSelected: true,
    language: "th",
    trimWhitespace: true,
    ignoreBlankRows: true,
    deduplicate: true,
  },
};

function sessionReducer(state, action) {
  switch (action.type) {
    case "importNames": {
      const cleaned = sanitizeNames(action.payload.names, state.settings);
      return {
        ...state,
        sourceFileName: action.payload.fileName || state.sourceFileName,
        allNames: cleaned,
        remainingNames: cleaned,
        results: [],
        drawHistory: [],
      };
    }

    case "setSetting": {
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.payload.key]: action.payload.value,
        },
      };
    }

    case "addName": {
      const rawName = String(action.payload.name ?? "").trim();
      if (!rawName) return state;

      if (state.settings.deduplicate) {
        const exists = state.allNames.some(
          (n) => String(n).toLowerCase() === rawName.toLowerCase()
        );
        if (exists) return state;
      }

      return {
        ...state,
        allNames: [...state.allNames, rawName],
        remainingNames: [...state.remainingNames, rawName],
      };
    }

    case "spin": {
      const pool = state.settings.removeAfterSelected ? state.remainingNames : state.allNames;
      if (pool.length === 0) return state;

      const pickedIndex = Math.floor(Math.random() * pool.length);
      const pickedName = pool[pickedIndex];
      const resultId = `${Date.now()}-${Math.random()}`;
      const newResult = {
        id: resultId,
        no: state.results.length + 1,
        name: pickedName,
        timestamp: nowIsoLocal(),
        status: "Selected",
      };

      const remainingNames = state.settings.removeAfterSelected
        ? pool.filter((_, idx) => idx !== pickedIndex)
        : state.remainingNames;

      return {
        ...state,
        remainingNames,
        results: [...state.results, newResult],
        drawHistory: [
          ...state.drawHistory,
          {
            resultId,
            removedName: pickedName,
            removedIndex: pickedIndex,
            usedRemoveMode: state.settings.removeAfterSelected,
          },
        ],
      };
    }

    case "spinByName": {
      const pool = state.settings.removeAfterSelected ? state.remainingNames : state.allNames;
      if (pool.length === 0) return state;

      let pickedIndex = pool.findIndex((name) => name === action.payload.name);
      if (pickedIndex < 0) {
        pickedIndex = Math.floor(Math.random() * pool.length);
      }
      const pickedName = pool[pickedIndex];
      const resultId = `${Date.now()}-${Math.random()}`;
      const newResult = {
        id: resultId,
        no: state.results.length + 1,
        name: pickedName,
        timestamp: nowIsoLocal(),
        status: "Selected",
      };

      const remainingNames = state.settings.removeAfterSelected
        ? pool.filter((_, idx) => idx !== pickedIndex)
        : state.remainingNames;

      return {
        ...state,
        remainingNames,
        results: [...state.results, newResult],
        drawHistory: [
          ...state.drawHistory,
          {
            resultId,
            removedName: pickedName,
            removedIndex: pickedIndex,
            usedRemoveMode: state.settings.removeAfterSelected,
          },
        ],
      };
    }

    case "undo": {
      if (state.drawHistory.length === 0) return state;
      const last = state.drawHistory[state.drawHistory.length - 1];

      const results = state.results.map((row) =>
        row.id === last.resultId ? { ...row, status: "Undone" } : row
      );

      let remainingNames = state.remainingNames;
      if (last.usedRemoveMode) {
        const restored = [...state.remainingNames];
        const safeIndex = Math.min(last.removedIndex, restored.length);
        restored.splice(safeIndex, 0, last.removedName);
        remainingNames = restored;
      }

      return {
        ...state,
        remainingNames,
        results,
        drawHistory: state.drawHistory.slice(0, -1),
      };
    }

    case "clearResults": {
      return {
        ...state,
        results: [],
        drawHistory: [],
      };
    }

    case "resetSession": {
      return {
        ...initialState,
        settings: { ...state.settings },
      };
    }

    default:
      return state;
  }
}

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  const value = useMemo(() => {
    const selectedCount = state.results.filter((r) => r.status === "Selected").length;
    return {
      state,
      stats: {
        total: state.allNames.length,
        remaining: state.remainingNames.length,
        selected: selectedCount,
      },
      actions: {
        importNames: (names, fileName) =>
          dispatch({ type: "importNames", payload: { names, fileName } }),
        setSetting: (key, value) => dispatch({ type: "setSetting", payload: { key, value } }),
        addName: (name) => dispatch({ type: "addName", payload: { name } }),
        spin: () => dispatch({ type: "spin" }),
        spinByName: (name) => dispatch({ type: "spinByName", payload: { name } }),
        undo: () => dispatch({ type: "undo" }),
        clearResults: () => dispatch({ type: "clearResults" }),
        resetSession: () => dispatch({ type: "resetSession" }),
      },
    };
  }, [state]);

  return createElement(SessionContext.Provider, { value }, children);
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
