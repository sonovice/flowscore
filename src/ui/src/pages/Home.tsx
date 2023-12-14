import { useNavigate } from "@solidjs/router";

function Home() {
  const navigate = useNavigate();
  let stavesRef: HTMLInputElement

  function doIt() {
    const staves = stavesRef.value;   
    navigate(`/score?staves=${staves}`)
  }

  return (
    <>
      Select staves:
      <input ref={stavesRef!} type="text" class="ml-2 px-2 py-1 border-black border"></input>
      <button class="ml-2 px-2 ly-1 border-2 rounded border-black" onClick={doIt}>Lez Do It!</button>
    </>
  )
}

export default Home