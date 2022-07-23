import LinkedinIcon from './svgs/linkedin-icon';
import GithubIcon from './svgs/github-icon';
import EmailIcon from './svgs/email-icon';

export default function About() {
  const NICKNAME = 'darkmannn';
  const EMAIL = 'darko.milosevic@darkmannn.dev';
  return (
    <div className="social">
      <style jsx>{`
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
          color: var(--color-tan-mud);
          transition: all 0.15s ease-in;
        }
        .social-icon:hover {
          filter: brightness(0.7);
          transform: scale(1.1, 1.1);
        }
      `}</style>
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
  );
}
