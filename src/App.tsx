import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
// ここから追加
import ApplicationForm from './components/ApplicationForm.tsx'
// ここまで追加


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* 以前のロゴやボタン、テキストは一旦消して、ApplicationFormを表示する */}
      <ApplicationForm />
    </>
  )
}

export default App
