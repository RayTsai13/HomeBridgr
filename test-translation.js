// Test script to verify translation API
const testTranslation = async () => {
  try {
    console.log('Testing translation API...')
    console.log('Make sure server is running: npm run dev')
    
    const response = await fetch('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: "Hello, how are you?",
        targetLanguage: "es"
      })
    })

    const data = await response.json()
    console.log('Translation result:', data)
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testTranslation()
