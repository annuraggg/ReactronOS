import React, { useState, useEffect, useCallback } from "react";
import {
  IconX,
  IconMinus,
  IconMaximize,
  IconSquare,
} from "@tabler/icons-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

type WindowManagerProps = {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  isFocused: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  zIndex: number;

  onFocus?: () => void;
  onMaximize?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onSnap?: (side: "left" | "right") => void;

  position?: { x: number; y: number };
  size?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
};

const MINIMIZED_HEIGHT = 32;

const WindowManager: React.FC<WindowManagerProps> = ({
  title,
  children,
  icon,
  isFocused,
  isMaximized,
  isMinimized,
  zIndex,
  onFocus,
  onMaximize,
  onMinimize,
  onClose,
  onPositionChange,
  onSizeChange,
  onSnap,
  position,
  size,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 500, height: 400 },
}) => {
  const [internalPosition, setInternalPosition] = useState(
    position || defaultPosition
  );
  const [internalSize, setInternalSize] = useState(size || defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastPointerX, setLastPointerX] = useState<number | null>(null);

  const currentPosition = position || internalPosition;
  const currentSize = size || internalSize;

  useEffect(() => {
    if (position) setInternalPosition(position);
  }, [position]);
  useEffect(() => {
    if (size) setInternalSize(size);
  }, [size]);

  const handleFocus = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isFocused && onFocus) onFocus();
  };
  const handleMaximize = () => onMaximize && onMaximize();
  const handleMinimize = () => onMinimize && onMinimize();
  const handleClose = () => onClose && onClose();

  const handleTitleBarDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleMaximize();
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
      const target = e.target as HTMLElement;
      const isButton = target.closest("button");
      const isTitleBar = target.closest(".window-drag-handle");
      if (isButton || !isTitleBar) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - currentPosition.x,
        y: e.clientY - currentPosition.y,
      });
      handleFocus();
    },
    [isMaximized, currentPosition, handleFocus]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setLastPointerX(e.clientX);
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const maxX = window.innerWidth - currentSize.width;
      const maxY = window.innerHeight - currentSize.height;
      const constrainedPosition = {
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      };
      if (onPositionChange) onPositionChange(constrainedPosition);
      else setInternalPosition(constrainedPosition);
    };
    const handleMouseUp = () => {
      if (onSnap && lastPointerX !== null) {
        if (lastPointerX < 28) onSnap("left");
        if (lastPointerX > window.innerWidth - 28) onSnap("right");
      }
      setLastPointerX(null);
      setIsDragging(false);
    };
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, currentSize, onPositionChange, onSnap, lastPointerX]);

  const minimizedY = window.innerHeight - MINIMIZED_HEIGHT - 20;

  type VariantCustom = {
    isMaximized: boolean;
    normal: {
      top: number;
      left: number;
      width: number;
      height: number;
    };
  };

  const variants = {
    initial: (custom: VariantCustom) => ({
      opacity: 0,
      scale: 0.97,
      y: 40,
      ...custom.normal,
    }),
    animate: (custom: VariantCustom) =>
      custom.isMaximized
        ? {
            opacity: 1,
            scale: 1,
            y: 0,
            top: 0,
            left: 0,
            width: "100vw",
            height: "calc(100vh - 55px)",
            borderRadius: 0,
            transition: {
              type: "spring",
              stiffness: 250,
              damping: 30,
            },
          }
        : {
            opacity: 1,
            scale: 1,
            y: 0,
            top: custom.normal.top,
            left: custom.normal.left,
            width: custom.normal.width,
            height: custom.normal.height,
            borderRadius: 12,
            transition: {
              type: "spring",
              stiffness: 280,
              damping: 30,
            },
          },
    exit: () => ({
      opacity: 0,
      scale: 0.93,
      y: 60,
      transition: { duration: 0.17 },
    }),
    minimized: () => ({
      opacity: 0,
      y: minimizedY,
      scale: 0.88,
      pointerEvents: "none" as const,
      transition: { type: "spring", stiffness: 350, damping: 35 },
    }),
  };

  const custom = {
    isMaximized,
    normal: {
      top: currentPosition.y,
      left: currentPosition.x,
      width: currentSize.width,
      height: currentSize.height,
    },
  };

  const animState = isMinimized ? "minimized" : "animate";

  return (
    <AnimatePresence>
      <motion.div
        key={title}
        tabIndex={-1}
        className={clsx(
          "fixed flex flex-col shadow-2xl border border-zinc-800 bg-zinc-900 text-white",
          isFocused ? "bg-zinc-900" : "bg-zinc-900/90",
          isMaximized && "rounded-none",
          !isMaximized && "rounded-xl",
          isDragging && "select-none"
        )}
        style={{
          zIndex,
          boxShadow: isFocused
            ? "0 8px 32px rgba(0,0,0,0.20), 0 1.5px 8px rgba(0,0,0,0.10)"
            : "0 6px 18px rgba(0,0,0,0.13)",
        }}
        initial="initial"
        animate={animState}
        exit="exit"
        variants={variants}
        custom={custom}
        transition={{ layout: { duration: 0.32, type: "spring" } }}
        onClick={handleFocus}
        onMouseDown={(e) => e.stopPropagation()}
        layout
        drag={false}
      >
        {/* Titlebar */}
        <div
          className={clsx(
            "window-drag-handle flex items-center justify-between px-4 py-3 select-none",
            isFocused ? "bg-zinc-800" : "bg-zinc-850",
            isMaximized ? "rounded-none" : "rounded-t-xl",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onDoubleClick={handleTitleBarDoubleClick}
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {icon && (
              <div className="flex-shrink-0 w-4 h-4 text-zinc-400">{icon}</div>
            )}
            <span
              className={clsx(
                "text-sm font-medium truncate",
                isFocused ? "text-white" : "text-zinc-400"
              )}
            >
              {title}
            </span>
          </div>
          <div className="flex gap-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMinimize();
              }}
              className="flex items-center justify-center w-8 h-6 rounded hover:bg-yellow-500/20 z-10"
              title="Minimize"
              type="button"
            >
              <IconMinus size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMaximize();
              }}
              className="flex items-center justify-center w-8 h-6 rounded hover:bg-green-500/20 z-10"
              title={isMaximized ? "Restore" : "Maximize"}
              type="button"
            >
              {isMaximized ? (
                <IconSquare size={12} />
              ) : (
                <IconMaximize size={14} />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="flex items-center justify-center w-8 h-6 rounded hover:bg-red-500/20 z-10"
              title="Close"
              type="button"
            >
              <IconX size={14} />
            </button>
          </div>
        </div>
        {/* Window Content */}
        <div className="flex-1 overflow-auto bg-zinc-900">{children}</div>
        {/* Simple resize handle (bottom-right corner only) */}
        {!isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={(e) => {
              e.stopPropagation();
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = currentSize.width;
              const startHeight = currentSize.height;

              const handleMouseMove = (e: MouseEvent) => {
                const newWidth = Math.max(
                  300,
                  startWidth + (e.clientX - startX)
                );
                const newHeight = Math.max(
                  200,
                  startHeight + (e.clientY - startY)
                );
                const newSize = { width: newWidth, height: newHeight };

                if (onSizeChange) {
                  onSizeChange(newSize);
                } else {
                  setInternalSize(newSize);
                }
              };

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          >
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-zinc-600 opacity-50" />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default WindowManager;
