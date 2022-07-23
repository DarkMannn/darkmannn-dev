import Title from './title';
import About from './about';

export default function Header() {
  return (
    <header>
      <style jsx>{`
        header {
          grid-area: header;
          border-bottom: var(--border-width) solid var(--color-brown-mud);
          display: flex;
          flex-direction: row;
          justify-content: space-evenly;
          align-items: center;
        }
      `}</style>
      <Title></Title>
      <About></About>
    </header>
  );
}
