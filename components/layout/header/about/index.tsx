import Social from './social';

export default function About() {
  const ABOUT = {
    who: ['developer', 'blogger', 'minimalist'],
    what: ['typescript', 'full-stack', 'aws'],
    how: ['thorough', 'unbiased', 'open_minded'],
  };
  return (
    <div className="about">
      <style jsx>{`
        .about {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0;
        }
        .row-title {
          display: flex;
          flex-flow: row nowrap;
          justify-content: center;
          width: 300px;
          padding: 5px 0;
          margin-bottom: 0;
          font-size: 14px;
          text-align: left;
          color: var(--color-tan-mud);
        }
        .row-words {
          display: flex;
          flex-flow: row nowrap;
          justify-content: center;
          width: 300px;
          margin-top: 0;
          font-size: 16px;
          text-align: center;
          font-family: 'RobotoMono';
        }
      `}</style>
      {Object.entries(ABOUT).map(([question, enumeration], index) => (
        <div key={index}>
          <h2 className="row-title">{question}</h2>
          <span className="row-words">{enumeration.join(' ')}</span>
        </div>
      ))}
      <Social></Social>
    </div>
  );
}
