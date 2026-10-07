import Editor from "@monaco-editor/react";
import { useState } from "react";
import { runCode } from "../api/runApi";
import "./Playground.css";

const languageTemplates = {
  Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}`,
  Python: `print("Hello World!")`,
  JavaScript: `console.log("Hello World!");`,
  C: `#include <stdio.h>

int main() {
    printf("Hello World!\\n");
    return 0;
}`,
  "C++": `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello World!" << endl;
    return 0;
}`,
};

const monacoLanguageMap = {
  Java: "java",
  Python: "python",
  JavaScript: "javascript",
  C: "c",
  "C++": "cpp",
};

export default function Playground() {
  const [title, setTitle] = useState("Untitled");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [language, setLanguage] = useState("Java");
  const [code, setCode] = useState(languageTemplates["Java"]);
  const [stdin, setStdin] = useState("");

  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(languageTemplates[newLang]);
    setOutput(null);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      // No problemId sent — Playground runs are never tied to any problem,
      // so the backend's premium/contest gating never applies here.
      const response = await runCode({ code, language, stdin });
      const result = response.data;
      setOutput({
        success: result.success,
        text: result.success ? result.output || "(no output)" : result.error,
      });
    } catch (err) {
      setOutput({
        success: false,
        text: err.response?.data?.error || "Failed to run code.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="playground-page">
      <div className="playground-toolbar">
        <div className="playground-toolbar-left">
          <button
            type="button"
            className="btn btn-primary playground-run-btn"
            onClick={handleRun}
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "▶ Run Code"}
          </button>

          {isEditingTitle ? (
            <input
              type="text"
              className="playground-title-input"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
            />
          ) : (
            <button
              type="button"
              className="playground-title-btn"
              onClick={() => setIsEditingTitle(true)}
              title="Rename"
            >
              {title} ✎
            </button>
          )}
        </div>

        <select
          value={language}
          onChange={handleLanguageChange}
          className="playground-language-select"
        >
          {Object.keys(languageTemplates).map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <div className="playground-body">
        <div className="playground-editor-wrapper">
          <Editor
            height="100%"
            language={monacoLanguageMap[language]}
            value={code}
            onChange={(value) => setCode(value ?? "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "Fira Code, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
            }}
          />
        </div>

        <div className="playground-side-panel">
          <div className="playground-panel-section">
            <div className="playground-panel-heading">stdin</div>
            <textarea
              className="playground-stdin-box"
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Input for your program (if it reads from stdin)..."
              rows={6}
            />
          </div>

          <div className="playground-panel-section playground-output-section">
            <div className="playground-panel-heading">Output</div>
            <div className="playground-output-box">
              {output === null && !isRunning && (
                <p className="playground-placeholder">Run your code to see output here.</p>
              )}
              {isRunning && <p className="playground-placeholder">Running...</p>}
              {output && (
                <pre
                  className={
                    output.success ? "playground-output-text success" : "playground-output-text error"
                  }
                >
                  {output.text}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}