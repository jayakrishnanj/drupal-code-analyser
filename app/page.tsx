"use client";

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

  return (
    <Container>
      <Typography variant="h1" component="h2" gutterBottom>
        Drupal Project Code Analysis
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
        <Box mt={4}>
          <Typography variant="h2" component="h3">
            Analysis Result
          </Typography>
          <pre>{response}</pre>
        </Box>
      )}
    </Container>
  );
};

export default Home;
