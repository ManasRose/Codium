import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import "./FileUpload.css";
import { VscCloudUpload } from "react-icons/vsc";

const FileUpload = ({ repoId, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true, // Disables click to open file dialog
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError("");
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    // You can prompt the user for a commit message
    const commitMessage = `Upload ${files.length} file(s)`;
    formData.append("message", commitMessage);

    try {
      await axios.post(
        `https://codium-backend.onrender.com/api/repo/${repoId}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setFiles([]); // Clear files after successful upload
      onUploadComplete(); // Notify parent component to refresh
    } catch (err) {
      setError("Upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <div
        {...getRootProps({
          className: `dropzone ${isDragActive ? "active" : ""}`,
        })}
      >
        <input {...getInputProps()} />
        <VscCloudUpload size={40} />
        <p>Drag and drop files here to upload</p>
      </div>
      {files.length > 0 && (
        <div className="file-preview-container">
          <h4>Ready to upload:</h4>
          <ul className="file-preview-list">
            {files.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="upload-btn"
          >
            {uploading ? "Uploading..." : `Commit ${files.length} file(s)`}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
