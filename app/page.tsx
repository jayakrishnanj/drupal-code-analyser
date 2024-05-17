'use client';

import React, { useState } from 'react';
import { Button, TextField, Typography, CircularProgress, Box, Container } from '@mui/material';

const Home = () => {
  const [folderPath, setFolderPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFolderPath(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setResponse(''); // Clear previous response

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folderPath }),
    });

    if (res.ok) {
      const result = await res.text(); // Expecting text response
      setResponse(result);
    } else {
      setResponse('Error in API call');
    }
    setIsLoading(false);
  };

  const handleDownloadMarkdown = () => {
    // Create a Blob with the markdown content
    const blob = new Blob([response], { type: 'text/markdown' });
    // Create an object URL for the Blob
    const url = URL.createObjectURL(blob);
    // Create a temporary anchor element
    const a = document.createElement('a');
    // Set the download name and href for the anchor
    a.download = 'analysis_report.md';
    a.href = url;
    // Trigger the download by programmatically clicking the anchor
    a.click();
    // Revoke the object URL to free up resources
    URL.revokeObjectURL(url);
  };

  return (
    <Container>
      <Typography variant="h2" component="h3" gutterBottom>
      Automated Code Review for Drupal Projects using OpenAI
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box mb={2}>
          <TextField
            label="Drupal Project Root Folder Path"
            variant="outlined"
            fullWidth
            value={folderPath}
            onChange={handleInputChange}
            required
          />
        </Box>
        <Box mb={2}>
          <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </Box>
      </form>
      {response && (
        <>
          <Box mt={4}>
            <Typography variant="h2" component="h3">
              Analysis Result
            </Typography>
             {/* Button to download the report as a markdown file */}
             <Button
              variant="contained"
              color="secondary"
              onClick={handleDownloadMarkdown}
              style={{ marginTop: '20px' }} // Adding some spacing above the button
            >
              Download as Markdown
            </Button>
            <pre>{response}</pre>
          </Box>
        </>
      )}
    </Container>
  );
};

export default Home;