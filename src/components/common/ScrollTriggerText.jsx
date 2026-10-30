import React, { useRef, useState, useEffect } from 'react';

// CraftCombine signature luxury organic ease curve (easeOutQuart)
export const CRAFT_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Hook to track when an element enters the viewport via scroll
 */
export const useScrollTrigger = ({
  threshold = 0.15,
  rootMargin = '0px 0px -40px 0px',
  once = true,
} = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, once]);

  return [ref, isVisible];
};

/**
 * ScrollTriggerText:
 * High-end editorial word-by-word reveal animation just like craftcombine.org.
 * Each word is masked inside an overflow: hidden container and smoothly
 * translates up from below with organic deceleration and staggered timing.
 */
export const ScrollTriggerText = ({
  text,
  children,
  as: Component = 'div',
  className = '',
  wordClassName = '',
  delay = 0,
  stagger = 0.035,
  duration = 0.8,
  y = 110,
  once = true,
  threshold = 0.15,
  ease = CRAFT_EASE,
  style = {},
  ...props
}) => {
  const [ref, isVisible] = useScrollTrigger({ threshold, once });
  const rawText = text || (typeof children === 'string' ? children : '');

  // Split into words while preserving spaces
  const words = rawText ? rawText.split(' ') : [];

  return (
    <Component
      ref={ref}
      className={`inline-block ${className}`}
      style={style}
      {...props}
    >
      {words.length > 0 ? (
        words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="inline-block overflow-hidden align-top leading-tight py-[0.1em]"
          >
            <span
              className={`inline-block transition-all transform-gpu ${wordClassName}`}
              style={{
                transform: isVisible
                  ? 'translate3d(0, 0, 0)'
                  : `translate3d(0, ${y}%, 0)`,
                opacity: isVisible ? 1 : 0,
                transitionDuration: `${duration}s`,
                transitionDelay: `${delay + index * stagger}s`,
                transitionTimingFunction: ease,
                willChange: 'transform, opacity',
              }}
            >
              {word}&nbsp;
            </span>
          </span>
        ))
      ) : (
        <span
          className="inline-block transition-all transform-gpu"
          style={{
            transform: isVisible
              ? 'translate3d(0, 0, 0)'
              : `translate3d(0, 32px, 0)`,
            opacity: isVisible ? 1 : 0,
            transitionDuration: `${duration}s`,
            transitionDelay: `${delay}s`,
            transitionTimingFunction: ease,
          }}
        >
          {children}
        </span>
      )}
    </Component>
  );
};

/**
 * ScrollReveal:
 * Drop-in container reveal matching craftcombine.org's <Reveal> component.
 * Slides up elements (cards, icons, paragraphs, badges) on scroll into view.
 */
export const ScrollReveal = ({
  as: Component = 'div',
  children,
  className = '',
  delay = 0,
  y = 36,
  x = 0,
  scale = 1,
  duration = 0.85,
  once = true,
  threshold = 0.15,
  ease = CRAFT_EASE,
  style = {},
  ...props
}) => {
  const [ref, isVisible] = useScrollTrigger({ threshold, once });

  return (
    <Component
      ref={ref}
      className={`${className}`}
      style={{
        ...style,
        transform: isVisible
          ? 'translate3d(0, 0, 0) scale(1)'
          : `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${duration}s`,
        transitionDelay: `${delay}s`,
        transitionTimingFunction: ease,
        transitionProperty: 'transform, opacity',
        willChange: 'transform, opacity',
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * ScrollSectionHeading:
 * Full section heading banner matching craftcombine.org aesthetic with
 * an eyebrow pill tag, editorial word-revealed headline, and soft subtitle.
 */
export const ScrollSectionHeading = ({
  eyebrow,
  title,
  subtitle,
  action,
  align = 'left',
  className = '',
  titleClassName = '',
  subtitleClassName = '',
  delay = 0,
}) => {
  const isCentered = align === 'center';

  return (
    <div
      className={`flex flex-col gap-3.5 mb-6 ${
        isCentered
          ? 'items-center text-center'
          : 'md:flex-row md:items-end md:justify-between'
      } ${className}`}
    >
      <div className={`max-w-2xl ${isCentered ? 'text-center' : ''}`}>
        {eyebrow && (
          <ScrollReveal delay={delay} y={20} duration={0.6}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-800 text-[11px] font-black uppercase tracking-wider mb-2 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
              {eyebrow}
            </div>
          </ScrollReveal>
        )}

        {title && (
          <ScrollTriggerText
            as="h2"
            text={title}
            delay={delay + 0.08}
            className={`text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight ${titleClassName}`}
          />
        )}

        {subtitle && (
          <ScrollReveal delay={delay + 0.2} y={24} duration={0.7}>
            <p className={`text-xs sm:text-sm text-slate-500 font-medium mt-1.5 leading-relaxed ${subtitleClassName}`}>
              {subtitle}
            </p>
          </ScrollReveal>
        )}
      </div>

      {action && (
        <ScrollReveal delay={delay + 0.25} y={24} duration={0.7}>
          <div className="shrink-0">{action}</div>
        </ScrollReveal>
      )}
    </div>
  );
};

export default ScrollTriggerText;
