import { useState, useRef } from "react";
import { bulkImportTestCases, downloadSampleTestCaseZip } from "../../api/adminTestCaseApi";
import "./TestCaseZipImport.css";

export default function TestCaseZipImport({ problemId, onImported }) {
  const [file, setFile] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) {
      setError("Choose a .zip file first.");
      return;
    }
    if (
      replaceExisting &&
      !window.confirm("This will DELETE all existing test cases for this problem first. Continue?")
    ) {
      return;
    }

    setError("");
    setResult(null);
    setIsUploading(true);
    try {
      const response = await bulkImportTestCases(problemId, file, replaceExisting);
      setResult(response.data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onImported) onImported();
    } catch (err) {
      setError(err.response?.data?.error || "Import failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await downloadSampleTestCaseZip();
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/zip" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "test-cases-sample.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Could not download the sample ZIP.");
    }
  };

  return (
    <div className="tcz-box">
      <div className="tcz-head">
        <strong>Bulk import from ZIP</strong>
        <button type="button" className="tcz-link" onClick={handleDownloadSample}>
          Download sample ZIP
        </button>
      </div>

      <p className="tcz-hint">
        Pair files like <code>1.in</code> + <code>1.out</code>, <code>input1.txt</code> +{" "}
        <code>output1.txt</code>, or <code>input/1.txt</code> + <code>output/1.txt</code>. Up to 300
        test cases per ZIP.
      </p>

      <div className="tcz-row">
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setError("");
          }}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={isUploading || !file}
        >
          {isUploading ? "Importing..." : "Import test cases"}
        </button>
      </div>

      <label className="tcz-check">
        <input
          type="checkbox"
          checked={replaceExisting}
          onChange={(e) => setReplaceExisting(e.target.checked)}
        />
        Replace existing test cases (otherwise new ones are added and duplicates skipped)
      </label>

      {error && <p className="tcz-error">{error}</p>}

      {result && (
        <div className="tcz-result">
          <p>
            ✅ <strong>{result.imported}</strong> imported · {result.skippedDuplicates} duplicates
            skipped · {result.skippedInvalid} invalid skipped
            {result.deletedExisting > 0 && <> · {result.deletedExisting} old ones replaced</>}
          </p>
          <p>
            This problem now has <strong>{result.totalTestCasesNow}</strong> test cases.
          </p>
          

          {(result.warnings ?? []).length > 0 && (
                <details>
                    <summary>{result.warnings.length} warning(s)</summary>
                    <ul>
                    {result.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                    ))}
                    </ul>
                </details>
            )}
        </div>
      )}
    </div>
  );
}