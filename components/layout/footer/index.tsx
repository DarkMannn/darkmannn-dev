export default function Footer() {
  return (
    <footer>
      <style jsx>{`
        footer {
          grid-area: footer;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
      `}</style>
      <p>{new Date().getFullYear()} © Darko Milošević</p>
    </footer>
  );
}
