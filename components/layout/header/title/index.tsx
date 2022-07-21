import OptimizedImage from 'next-image-export-optimizer';

export default function Title() {
  return (
    <div className="title">
      <style jsx>{`
        .title {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .portrait {
          position: relative;
          width: 135px;
          height: 135px;
          border: 3px solid black;
          border-radius: 50%;
          margin: var(----standard-margin);
          background-color: whitesmoke;
          cursor: pointer;
        }
        .nickname {
          margin: 0 0 10px 0;
          font-family: 'Roboto';
          font-weight: 100;
          font-size: 65px;
          text-align: center;
        }
      `}</style>
      <div className="portrait">
        <OptimizedImage
          src="/images/balance-mini.png"
          alt="beaver"
          layout="fill"
          objectFit="scale-down"
          priority
        />
      </div>
      <h1 className="nickname">DarkMannn</h1>
    </div>
  );
}
