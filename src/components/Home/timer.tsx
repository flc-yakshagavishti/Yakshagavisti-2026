import { type Dispatch } from "react";
import { useTimer } from "react-timer-hook";
import { useTranslations } from "use-intl";

interface Props {
  setIsRegistrationActive: Dispatch<boolean>;
}

const Timer = ({ setIsRegistrationActive }: Props) => {
  const t = useTranslations("Timer");
  const expiryTimestamp = new Date("2026-10-24 9:30");
  const { seconds, minutes, hours, days } = useTimer({
    expiryTimestamp,
    onExpire: () => {
      if (setIsRegistrationActive) {
        setIsRegistrationActive(false);
      }
    },
  });

  return (
    <div className="flex select-none justify-center space-x-7 font-rhomdon text-3xl font-black drop-shadow-[0_0_1.5px_theme(colors.secondary-100)] sm:text-4xl md:space-x-9 lg:text-6xl 2xl:text-7xl">
      <div className="flex flex-col items-baseline space-x-1 md:space-x-2">
        <span className="">{String(days).padStart(2, "0")}</span>
        <span className="text-2xl font-thin sm:text-3xl lg:text-4xl 2xl:text-6xl">
          {t("Days")}
        </span>
      </div>
      <div className="flex flex-col items-baseline space-x-1 md:space-x-2">
        <span className="">{String(hours).padStart(2, "0")}</span>
        <span className="text-2xl font-thin sm:text-3xl lg:text-4xl 2xl:text-6xl">
          {t("Hours")}
        </span>
      </div>
      <div className="flex flex-col items-baseline space-x-1 md:space-x-2">
        <span className="">{String(minutes).padStart(2, "0")}</span>
        <span className="text-2xl font-thin sm:text-3xl lg:text-4xl 2xl:text-6xl">
          {t("Minutes")}
        </span>
      </div>
      <div className="flex flex-col items-baseline space-x-1 md:space-x-2">
        <span className="">{String(seconds).padStart(2, "0")}</span>
        <span className="text-2xl font-thin sm:text-3xl lg:text-4xl 2xl:text-6xl">
          {t("Seconds")}
        </span>
      </div>
    </div>
  );
};

export default Timer;
