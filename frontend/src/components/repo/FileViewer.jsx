import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "./FileViewer.css";
import Navbar from "../Navbar/Navbar";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const FileViewer = () => {
  const { repoId, commitId } = useParams();
  const filePath = useParams()["*"];
  const [fileContent, setFileContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFileContent = async () => {
      try {
        const response = await axios.get(
          `https://codium-backend.onrender.com/api/repo/${repoId}/commit/${commitId}/file/${filePath}`
        );

        let content = response.data;
        if (typeof content === "object" && content !== null) {
          content = JSON.stringify(content, null, 2);
        }
        setFileContent(content);
      } catch (err) {
        console.error("Error fetching file content:", err);
        setFileContent("Error: Could not load file content.");
      } finally {
        setIsLoading(false);
      }
    };
    if (repoId && commitId && filePath) {
      fetchFileContent();
    }
  }, [repoId, commitId, filePath]);

  if (isLoading) {
    return <div className="loading-state">Loading file...</div>;
  }

  const language = filePath.split(".").pop();

  return (
    <>
      <Navbar />
      <main className="file-viewer-container">
        <div className="file-viewer-header">
          <Link
            to={`/repo/${repoId}/tree/${commitId}/${filePath.substring(
              0,
              filePath.lastIndexOf("/")
            )}`}
          >
            Back to repository
          </Link>{" "}
          / <span>{filePath.split("/").pop()}</span>
        </div>
        <div className="file-content-wrapper">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            showLineNumbers
            wrapLines={true} // Good for long lines
            wrapLongLines={true} // Good for long lines
          >
            {String(fileContent)}
          </SyntaxHighlighter>
        </div>
      </main>
    </>
  );
};

export default FileViewer;
