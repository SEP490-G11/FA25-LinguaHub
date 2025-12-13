import React, { useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

const SOFT_EASE = [0.4, 0, 0.2, 1] as const;

type BtnProps = {
  href: string;
  label: string;
  gradient: string;
  waveRing: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

const PulseWaves: React.FC<{ waveRing: string; waves?: number }> = ({
  waveRing,
  waves = 3
}) => {
  const duration = 2.2;
  const controls = useAnimation();
  const timeouts = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    let running = true;
    const animate = async () => {
      while (running) {
        for (let i = 0; i < waves; i++) {
          controls.start((idx) =>
            idx === i
              ? {
                  scale: [0.9, 1.5],
                  opacity: [0.35, 0],
                  transition: { duration, ease: SOFT_EASE }
                }
              : {}
          );
          await new Promise((res) => {
            const t = setTimeout(res, duration * 330);
            timeouts.current.push(t as any);
          });
        }
      }
    };
    animate();
    return () => {
      running = false;
      timeouts.current.forEach(clearTimeout);
    };
  }, [controls, waves]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {Array.from({ length: waves }).map((_, i) => (
        <motion.span
          key={i}
          custom={i}
          animate={controls}
          initial={{ scale: 0.9, opacity: 0.35 }}
          className={`absolute inset-0 rounded-full ring-8 ${waveRing}`}
        />
      ))}
    </div>
  );
};

const RingButton: React.FC<BtnProps> = ({
  href,
  label,
  gradient,
  waveRing,
  Icon
}) => (
  <a
    href={href}
    aria-label={label}
    title={label}
    className="group relative block"
    tabIndex={0}
  >
    {/* Sóng màu */}
    <PulseWaves waveRing={waveRing} />

    {/* Vòng gradient */}
    <span
      className={[
        'relative grid place-items-center rounded-full',
        'p-[3px] shadow-lg',
        `bg-gradient-to-br ${gradient}`
      ].join(' ')}
    >
      <span
        className={[
          'relative grid place-items-center rounded-full',
          'size-14 bg-white',
          'transition-transform duration-200 group-hover:scale-[1.06]'
        ].join(' ')}
      >
        <Icon className="size-7" />
      </span>
    </span>
  </a>
);

const PhoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    {...props}
  >
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g
      id="SVGRepo_tracerCarrier"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></g>
    <g id="SVGRepo_iconCarrier">
      {' '}
      <path
        d="M14.05 6C15.0268 6.19057 15.9244 6.66826 16.6281 7.37194C17.3318 8.07561 17.8095 8.97326 18 9.95M14.05 2C16.0793 2.22544 17.9716 3.13417 19.4163 4.57701C20.8609 6.01984 21.7721 7.91101 22 9.94M18.5 21C9.93959 21 3 14.0604 3 5.5C3 5.11378 3.01413 4.73086 3.04189 4.35173C3.07375 3.91662 3.08968 3.69907 3.2037 3.50103C3.29814 3.33701 3.4655 3.18146 3.63598 3.09925C3.84181 3 4.08188 3 4.56201 3H7.37932C7.78308 3 7.98496 3 8.15802 3.06645C8.31089 3.12515 8.44701 3.22049 8.55442 3.3441C8.67601 3.48403 8.745 3.67376 8.88299 4.05321L10.0491 7.26005C10.2096 7.70153 10.2899 7.92227 10.2763 8.1317C10.2643 8.31637 10.2012 8.49408 10.0942 8.64506C9.97286 8.81628 9.77145 8.93713 9.36863 9.17882L8 10C9.2019 12.6489 11.3501 14.7999 14 16L14.8212 14.6314C15.0629 14.2285 15.1837 14.0271 15.3549 13.9058C15.5059 13.7988 15.6836 13.7357 15.8683 13.7237C16.0777 13.7101 16.2985 13.7904 16.74 13.9509L19.9468 15.117C20.3262 15.255 20.516 15.324 20.6559 15.4456C20.7795 15.553 20.8749 15.6891 20.9335 15.842C21 16.015 21 16.2169 21 16.6207V19.438C21 19.9181 21 20.1582 20.9007 20.364C20.8185 20.5345 20.663 20.7019 20.499 20.7963C20.3009 20.9103 20.0834 20.9262 19.6483 20.9581C19.2691 20.9859 18.8862 21 18.5 21Z"
        stroke="#cc1e1e"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>{' '}
    </g>
  </svg>
);

const MessengerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" {...props}>
    <radialGradient
      id="a"
      cx="101.9"
      cy="809"
      r="1.1"
      gradientTransform="matrix(800 0 0 -800 -81386 648000)"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0" style={{ stopColor: '#09f' }} />
      <stop offset=".6" style={{ stopColor: '#a033ff' }} />
      <stop offset=".9" style={{ stopColor: '#ff5280' }} />
      <stop offset="1" style={{ stopColor: '#ff7061' }} />
    </radialGradient>
    <path
      fill="url(#a)"
      d="M400 0C174.7 0 0 165.1 0 388c0 116.6 47.8 217.4 125.6 287 6.5 5.8 10.5 14 10.7 22.8l2.2 71.2a32 32 0 0 0 44.9 28.3l79.4-35c6.7-3 14.3-3.5 21.4-1.6 36.5 10 75.3 15.4 115.8 15.4 225.3 0 400-165.1 400-388S625.3 0 400 0z"
    />
    <path
      fill="#FFF"
      d="m159.8 501.5 117.5-186.4a60 60 0 0 1 86.8-16l93.5 70.1a24 24 0 0 0 28.9-.1l126.2-95.8c16.8-12.8 38.8 7.4 27.6 25.3L522.7 484.9a60 60 0 0 1-86.8 16l-93.5-70.1a24 24 0 0 0-28.9.1l-126.2 95.8c-16.8 12.8-38.8-7.3-27.5-25.2z"
    />
  </svg>
);

const ZaloIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="50"
    height="50"
    viewBox="0 0 50 50"
    fill="none"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M22.782 0.166016H27.199C33.2653 0.166016 36.8103 1.05701 39.9572 2.74421C43.1041 4.4314 45.5875 6.89585 47.2557 10.0428C48.9429 13.1897 49.8339 16.7347 49.8339 22.801V27.1991C49.8339 33.2654 48.9429 36.8104 47.2557 39.9573C45.5685 43.1042 43.1041 45.5877 39.9572 47.2559C36.8103 48.9431 33.2653 49.8341 27.199 49.8341H22.8009C16.7346 49.8341 13.1896 48.9431 10.0427 47.2559C6.89583 45.5687 4.41243 43.1042 2.7442 39.9573C1.057 36.8104 0.166016 33.2654 0.166016 27.1991V22.801C0.166016 16.7347 1.057 13.1897 2.7442 10.0428C4.43139 6.89585 6.89583 4.41245 10.0427 2.74421C13.1707 1.05701 16.7346 0.166016 22.782 0.166016Z"
      fill="#0068FF"
    />
    <path
      opacity="0.12"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M49.8336 26.4736V27.1994C49.8336 33.2657 48.9427 36.8107 47.2555 39.9576C45.5683 43.1045 43.1038 45.5879 39.9569 47.2562C36.81 48.9434 33.265 49.8344 27.1987 49.8344H22.8007C17.8369 49.8344 14.5612 49.2378 11.8104 48.0966L7.27539 43.4267L49.8336 26.4736Z"
      fill="#001A33"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.779 43.5892C10.1019 43.846 13.0061 43.1836 15.0682 42.1825C24.0225 47.1318 38.0197 46.8954 46.4923 41.4732C46.8209 40.9803 47.1279 40.4677 47.4128 39.9363C49.1062 36.7779 50.0004 33.22 50.0004 27.1316V22.7175C50.0004 16.629 49.1062 13.0711 47.4128 9.91273C45.7385 6.75436 43.2461 4.28093 40.0877 2.58758C36.9293 0.894239 33.3714 0 27.283 0H22.8499C17.6644 0 14.2982 0.652754 11.4699 1.89893C11.3153 2.03737 11.1636 2.17818 11.0151 2.32135C2.71734 10.3203 2.08658 27.6593 9.12279 37.0782C9.13064 37.0921 9.13933 37.1061 9.14889 37.1203C10.2334 38.7185 9.18694 41.5154 7.55068 43.1516C7.28431 43.399 7.37944 43.5512 7.779 43.5892Z"
      fill="white"
    />
    <path
      d="M20.5632 17H10.8382V19.0853H17.5869L10.9329 27.3317C10.7244 27.635 10.5728 27.9194 10.5728 28.5639V29.0947H19.748C20.203 29.0947 20.5822 28.7156 20.5822 28.2606V27.1421H13.4922L19.748 19.2938C19.8428 19.1801 20.0134 18.9716 20.0893 18.8768L20.1272 18.8199C20.4874 18.2891 20.5632 17.8341 20.5632 17.2844V17Z"
      fill="#0068FF"
    />
    <path
      d="M32.9416 29.0947H34.3255V17H32.2402V28.3933C32.2402 28.7725 32.5435 29.0947 32.9416 29.0947Z"
      fill="#0068FF"
    />
    <path
      d="M25.814 19.6924C23.1979 19.6924 21.0747 21.8156 21.0747 24.4317C21.0747 27.0478 23.1979 29.171 25.814 29.171C28.4301 29.171 30.5533 27.0478 30.5533 24.4317C30.5723 21.8156 28.4491 19.6924 25.814 19.6924ZM25.814 27.2184C24.2785 27.2184 23.0273 25.9672 23.0273 24.4317C23.0273 22.8962 24.2785 21.645 25.814 21.645C27.3495 21.645 28.6007 22.8962 28.6007 24.4317C28.6007 25.9672 27.3685 27.2184 25.814 27.2184Z"
      fill="#0068FF"
    />
    <path
      d="M40.4867 19.6162C37.8516 19.6162 35.7095 21.7584 35.7095 24.3934C35.7095 27.0285 37.8516 29.1707 40.4867 29.1707C43.1217 29.1707 45.2639 27.0285 45.2639 24.3934C45.2639 21.7584 43.1217 19.6162 40.4867 19.6162ZM40.4867 27.2181C38.9322 27.2181 37.681 25.9669 37.681 24.4124C37.681 22.8579 38.9322 21.6067 40.4867 21.6067C42.0412 21.6067 43.2924 22.8579 43.2924 24.4124C43.2924 25.9669 42.0412 27.2181 40.4867 27.2181Z"
      fill="#0068FF"
    />
    <path
      d="M29.4562 29.0944H30.5747V19.957H28.6221V28.2793C28.6221 28.7153 29.0012 29.0944 29.4562 29.0944Z"
      fill="#0068FF"
    />
  </svg>
);

// --- Floating stack ---
export default function FloatingContactButtons() {
  return (
    <div className="fixed bottom-16 right-10 z-[60] flex flex-col gap-6">
      <RingButton
        href="tel:"
        label="Gọi ngay"
        gradient="from-red-300 to-red-400"
        waveRing="ring-red-500"
        Icon={PhoneIcon}
      />
      <RingButton
        href="https://m.me/yourpage"
        label="Messenger"
        gradient="from-violet-400/50 to-purple-600/50"
        waveRing="ring-violet-500"
        Icon={MessengerIcon}
      />
      <RingButton
        href="https://zalo.me/"
        label="Zalo"
        gradient="from-sky-400/50 to-blue-600/50"
        waveRing="ring-sky-500"
        Icon={ZaloIcon}
      />
    </div>
  );
}
