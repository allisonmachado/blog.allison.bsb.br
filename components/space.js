export default function Space({ times }) {
  let spaces = '';

  for (let i = 0; i < times; i++) {
    spaces = spaces + '\u00A0'
  }
  return <>{spaces}</>
}
