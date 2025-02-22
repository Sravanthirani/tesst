import React, { useState, useRef } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-lg sticky-top custom-navbar">
      <div className="container">
        <a className="navbar-brand" href="/">Chemalyze</a>
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link text-white" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/about">About</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/contact">Contact Us</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

const App = () => {
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [showGeneratedOutput, setShowGeneratedOutput] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setIsCameraStarted(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraStarted(false);
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/png');
    setCapturedImage(imageData);
    stopCamera();
    sendImageToBackend(imageData);
  };

  const sendImageToBackend = async (imageData) => {
    const formData = new FormData();
    formData.append('image', dataURItoBlob(imageData));
    try {
      const response = await fetch('https://test-backend-production-1a07.up.railway.app/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setOcrResult(data.extractedText);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return new Blob([uint8Array], { type: 'image/png' });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target.result);
      sendImageToBackend(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const generateOutput = async () => {
    try {
      const response = await fetch('https://test-backend-production-1a07.up.railway.app/generate', { method: 'GET' });
      const data = await response.json();
      setGeneratedOutput(data.generatedText);
      setShowGeneratedOutput(true);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const resetAll = () => {
    stopCamera();
    setCapturedImage(null);
    setOcrResult('');
    setGeneratedOutput('');
    setShowGeneratedOutput(false);
  };

  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={(
          <div className="container mt-5 d-flex flex-column align-items-center">
            <div className="border border-secondary-subtle rounded-4 p-4 text-center bg-light shadow-sm" style={{ maxWidth: "500px" }}>
              <div className="border rounded p-4 bg-white">
                <p className="fw-medium text-dark">Upload or Capture Image</p>
                {isCameraStarted ? (
                  <>
                    <video ref={videoRef} autoPlay className="w-100 rounded" />
                    <canvas ref={canvasRef} className="d-none" />
                    <button className="btn capture-img btn-danger mt-3" onClick={captureImage}>Capture Image</button>
                  </>
                ) : (
                  <>
                    {capturedImage && <img src={capturedImage} alt="Captured" className="img-fluid rounded mb-3" />}
                    <div className="d-flex justify-content-center gap-3">
                      <button className="btn start-camera" onClick={startCamera}>Start Camera</button>
                      <button className="btn upload" onClick={() => fileInputRef.current.click()}>Upload Photo</button>
                    </div>
                    <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFileUpload} />
                  </>
                )}
              </div>
              {(capturedImage || ocrResult) && (
                <button className="btn reset mt-3" onClick={resetAll}>Reset</button>
              )}
            </div>
          </div>
        )} />
        
        <Route path="/about" element={
          <div className="container mt-5">
            <h2>About Us</h2>
            <p>Welcome to Chemalyze! This platform helps you analyze product ingredients and their chemical properties.</p>
          </div>
        } />

        <Route path="/contact" element={
          <div className="container mt-5">
            <h2>Contact Us</h2>
            <p>If you have any questions or feedback, please reach out to us at contact@chemalyze.com.</p>
          </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;
