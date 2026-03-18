export function OrbitLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="orbit-loader" />
      
      <style>
        {`
        .orbit-loader {
          --d:22px;
          width:4px;
          height:4px;
          border-radius:50%;
          color:#38bdf8;

          box-shadow:
            calc(1*var(--d))      calc(0*var(--d))     0 0,
            calc(0.707*var(--d))  calc(0.707*var(--d)) 0 1px,
            calc(0*var(--d))      calc(1*var(--d))     0 2px,
            calc(-0.707*var(--d)) calc(0.707*var(--d)) 0 3px,
            calc(-1*var(--d))     calc(0*var(--d))     0 4px,
            calc(-0.707*var(--d)) calc(-0.707*var(--d))0 5px,
            calc(0*var(--d))      calc(-1*var(--d))    0 6px;

          animation: orbitLoaderSpin 1s infinite steps(8);
        }

        @keyframes orbitLoaderSpin {
          100% {
            transform: rotate(1turn);
          }
        }
        `}
      </style>
    </div>
  );
}