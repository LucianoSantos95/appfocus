import { useEffect, useState, useCallback } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS } from "react-joyride";
import { tourSteps } from "./tourSteps";

interface GuidedTourProps {
  onTourComplete?: () => void;
  forceRun?: boolean;
}

const STORAGE_KEY = "hubTourCompleted";

export function GuidedTour({ onTourComplete, forceRun = false }: GuidedTourProps) {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (forceRun) {
      setStepIndex(0);
      setRunTour(true);
      return;
    }

    const hasSeenTour = localStorage.getItem(STORAGE_KEY) === "true";
    if (!hasSeenTour) {
      // Delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [forceRun]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index } = data;
      const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

      if (type === EVENTS.STEP_AFTER) {
        setStepIndex(index + 1);
      }

      if (finishedStatuses.includes(status)) {
        setRunTour(false);
        setStepIndex(0);
        localStorage.setItem(STORAGE_KEY, "true");
        onTourComplete?.();
      }
    },
    [onTourComplete]
  );

  return (
    <Joyride
      steps={tourSteps}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      spotlightClicks
      disableOverlayClose
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Finalizar",
        next: "Próximo",
        skip: "Pular Tour",
        open: "Abrir tour",
      }}
      floaterProps={{
        hideArrow: false,
      }}
      styles={{
        options: {
          backgroundColor: "hsl(210, 10%, 9%)",
          arrowColor: "hsl(210, 10%, 9%)",
          textColor: "hsl(210, 40%, 98%)",
          primaryColor: "hsl(213, 94%, 68%)",
          overlayColor: "rgba(0, 0, 0, 0.85)",
          zIndex: 10000,
          width: 380,
        },
        tooltip: {
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 0 50px hsla(213, 94%, 68%, 0.15)",
          border: "1px solid hsl(210, 15%, 15%)",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: "18px",
          fontWeight: 600,
          marginBottom: "8px",
          color: "hsl(210, 40%, 98%)",
        },
        tooltipContent: {
          fontSize: "14px",
          lineHeight: "1.6",
          color: "hsl(210, 20%, 75%)",
          padding: "8px 0",
        },
        buttonNext: {
          backgroundColor: "hsl(213, 94%, 68%)",
          color: "hsl(210, 40%, 98%)",
          borderRadius: "8px",
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: 500,
        },
        buttonBack: {
          color: "hsl(210, 20%, 75%)",
          marginRight: "10px",
          fontSize: "14px",
        },
        buttonSkip: {
          color: "hsl(210, 20%, 60%)",
          fontSize: "13px",
        },
        buttonClose: {
          color: "hsl(210, 20%, 75%)",
        },
        spotlight: {
          borderRadius: "12px",
          boxShadow: "0 0 30px hsla(213, 94%, 68%, 0.3)",
        },
        beacon: {
          display: "none",
        },
        beaconInner: {
          backgroundColor: "hsl(213, 94%, 68%)",
        },
        beaconOuter: {
          backgroundColor: "hsla(213, 94%, 68%, 0.3)",
          borderColor: "hsl(213, 94%, 68%)",
        },
      }}
      callback={handleJoyrideCallback}
    />
  );
}

export function useTour() {
  const [shouldRunTour, setShouldRunTour] = useState(false);

  const startTour = useCallback(() => {
    setShouldRunTour(true);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShouldRunTour(true);
  }, []);

  const onComplete = useCallback(() => {
    setShouldRunTour(false);
  }, []);

  return { shouldRunTour, startTour, resetTour, onComplete };
}
