import OptimizedImage from 'next-image-export-optimizer';
import LinkedinIcon from '../components/svgs/linkedin-icon';
import GithubIcon from '../components/svgs/github-icon';
import EmailIcon from '../components/svgs/email-icon';

export default function Home() {
  const ABOUT = {
    who: ['developer', 'blogger', 'minimalist'],
    what: ['typescript', 'full-stack', 'aws'],
    how: ['thorough', 'unbiased', 'open_minded'],
  };
  const NICKNAME = 'darkmannn';
  const EMAIL = 'darko.milosevic@darkmannn.dev';
  return (
    <div className="home">
      <style jsx>{`
        .home {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 0;
        }
        .title {
          font-size: 25px;
          font-weight: 400;
          border-bottom: var(--border-width) solid var(--color-grey-dim);
          color: var(--color-black-nuance);
          padding: 0 70px 30px;
          margin: 15px 0 30px;
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
          color: var(--color-grey-rose);
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

        .logo {
          position: relative;
          width: 75px;
          height: 75px;
          margin: 30px;
        }

        .social {
          width: 300px;
          margin: 30px 0 15px;
          display: flex;
          flex-direction: row;
          justify-content: space-evenly;
          align-items: center;
        }

        .social-icon {
          display: block;
          width: 30px;
          height: 30px;
          color: var(--color-grey-blue);
          transition: all 0.15s ease-in;
        }
        .social-icon:hover {
          filter: brightness(0.7);
          transform: scale(1.1, 1.1);
        }
      `}</style>
      <h1 className="title">Who am I?</h1>
      {Object.entries(ABOUT).map(([question, enumeration], index) => (
        <div key={index}>
          <h2 className="row-title">{question}</h2>
          <span className="row-words">{enumeration.join(' ')}</span>
        </div>
      ))}
      <div className="logo">
        <OptimizedImage
          src="/images/balance-mini.png"
          alt="beaver"
          layout="fill"
          objectFit="cover"
          priority
        />
      </div>
      <div className="social">
        <a
          className="social-icon"
          href={`https://www.linkedin.com/in/${NICKNAME}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <LinkedinIcon></LinkedinIcon>
        </a>
        <a
          className="social-icon"
          href={`https://github.com/${NICKNAME}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <GithubIcon></GithubIcon>
        </a>
        <a
          className="social-icon"
          href={`mailto:${EMAIL}?subject=Hey ${NICKNAME}!`}
          rel="noopener noreferrer"
          target="_blank"
        >
          <EmailIcon></EmailIcon>
        </a>
      </div>
    </div>
  );
}
