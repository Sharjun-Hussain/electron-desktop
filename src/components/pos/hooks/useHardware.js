import { useState, useEffect, useCallback } from 'react';
import { hardwareService } from '@/lib/qz-service';
import { toast } from 'sonner';

/**
 * useHardware Hook
 * Manages printer selection and hardware actions (print/kick).
 */
export const useHardware = () => {
  const [isReady, setIsReady] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [selectedScalePort, setSelectedScalePort] = useState(null);
  const [selectedDisplayPort, setSelectedDisplayPort] = useState(null);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize connection
  useEffect(() => {
    const init = async () => {
      setIsConnecting(true);
      const connected = await hardwareService.connect();
      setIsReady(connected);
      setIsConnecting(false);

      if (connected) {
        // Load saved devices
        const savedPrinter = localStorage.getItem("pos_selected_printer");
        if (savedPrinter) {
          const found = await hardwareService.findPrinter(savedPrinter);
          if (found) setSelectedPrinter(found);
        }

        setSelectedScalePort(localStorage.getItem("pos_selected_scale_port"));
        setSelectedDisplayPort(localStorage.getItem("pos_selected_display_port"));
      }
    };
    init();
  }, []);

  /**
   * Device Selectors
   */
  const pickPrinter = useCallback(async (name) => {
    const printer = await hardwareService.findPrinter(name);
    if (printer) {
      setSelectedPrinter(printer);
      localStorage.setItem("pos_selected_printer", name);
      toast.success(`Printer "${name}" selected`);
    }
    return printer;
  }, []);

  const pickScalePort = useCallback((port) => {
    setSelectedScalePort(port);
    localStorage.setItem("pos_selected_scale_port", port);
    toast.success(`Scale port "${port}" selected`);
  }, []);

  const pickDisplayPort = useCallback((port) => {
    setSelectedDisplayPort(port);
    localStorage.setItem("pos_selected_display_port", port);
    toast.success(`Display port "${port}" selected`);
  }, []);

  /**
   * Action: Scale Reading
   */
  const startScaleListening = useCallback(async () => {
    if (!selectedScalePort) return;
    await hardwareService.readScale(selectedScalePort, (weight) => {
      setCurrentWeight(weight);
    });
  }, [selectedScalePort]);

  const stopScaleListening = useCallback(async () => {
    if (!selectedScalePort) return;
    await hardwareService.closeSerial(selectedScalePort);
  }, [selectedScalePort]);

  /**
   * Action: Customer Display
   */
  const updateDisplay = useCallback(async (line1, line2) => {
    if (!selectedDisplayPort) return;
    await hardwareService.updateDisplay(selectedDisplayPort, line1, line2);
  }, [selectedDisplayPort]);

  /**
   * Action: Open Cash Drawer
   */
  const openDrawer = useCallback(async () => {
    if (!selectedPrinter) {
      console.warn("[Hardware] No printer selected for cash drawer");
      return;
    }
    await hardwareService.openCashDrawer(selectedPrinter);
  }, [selectedPrinter]);

  /**
   * Action: Print Receipt
   */
  const printReceipt = useCallback(async (html) => {
    if (!selectedPrinter) {
      toast.error("No printer selected. Please configure hardware settings.");
      return false;
    }
    try {
      await hardwareService.printHTML(selectedPrinter, html);
      return true;
    } catch (err) {
      toast.error("Printing failed. Check printer connection.");
      return false;
    }
  }, [selectedPrinter]);

  return {
    isReady,
    isConnecting,
    selectedPrinter,
    selectedScalePort,
    selectedDisplayPort,
    currentWeight,
    pickPrinter,
    pickScalePort,
    pickDisplayPort,
    startScaleListening,
    stopScaleListening,
    updateDisplay,
    openDrawer,
    printReceipt
  };
};
