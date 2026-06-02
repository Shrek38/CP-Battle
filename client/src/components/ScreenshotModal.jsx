// components/ScreenshotModal.jsx
// Modal to upload screenshot proof of accepted submission
import { useState } from 'react'

export default function ScreenshotModal({ onSubmit, onSkip, onClose }) {
  const [preview, setPreview] = useState(null)
  const [fileData, setFileData] = useState(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return

    // Limit to 4MB
    if (file.size > 4 * 1024 * 1024) {
      alert('File too large. Max 4MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result)
      setFileData(reader.result) // base64 string
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit() {
    onSubmit(fileData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} title="Close">✕</button>
        <h3>📸 Upload Proof</h3>
        <p className="card-desc">
          Upload a screenshot of your accepted submission to prove you solved it. 
          Your proof will be visible to all players on the results screen.
        </p>

        {preview ? (
          <>
            <img src={preview} alt="Screenshot preview" className="screenshot-preview" />
            <div className="btn-group">
              <button className="btn btn-success" onClick={handleSubmit}>
                ✅ Submit Proof
              </button>
              <button className="btn btn-ghost" onClick={() => { setPreview(null); setFileData(null); }}>
                Choose different file
              </button>
            </div>
          </>
        ) : (
          <label className="file-input-label">
            📁 Click to choose screenshot
            <input type="file" accept="image/*" onChange={handleFile} />
          </label>
        )}

        <button className="btn btn-ghost" onClick={onSkip} style={{ textAlign: 'center', width: '100%' }}>
          Skip — submit without proof
        </button>
      </div>
    </div>
  )
}
