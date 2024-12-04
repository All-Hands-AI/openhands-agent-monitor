export function getComputedStyle(element: HTMLElement, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

export function getCSSVariable(variableName: string): string {
  const style = getComputedStyle(document.documentElement, '--' + variableName);
  return style.trim();
}

// Helper to check if an element has dark theme compatible colors
export function hasDarkThemeColors(element: HTMLElement): boolean {
  const bgColor = getComputedStyle(element, 'background-color');
  const color = getComputedStyle(element, 'color');
  
  // Convert color names and hex to rgb
  const colorToRgb = (color: string): number[] => {
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    const computed = window.getComputedStyle(div).color;
    document.body.removeChild(div);
    return computed.match(/\d+/g)?.map(Number) || [];
  };

  // Convert rgb/rgba to brightness value (0-255)
  const getBrightness = (color: string): number => {
    const rgb = colorToRgb(color);
    if (rgb.length < 3) return 0;
    // Perceived brightness formula
    return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  };

  const bgBrightness = getBrightness(bgColor);
  const textBrightness = getBrightness(color);

  // For dark theme:
  // - Background should be dark (brightness < 128)
  // - Text should be light (brightness > 128)
  // - There should be sufficient contrast between them
  return (
    bgBrightness < 128 &&
    textBrightness > 128 &&
    Math.abs(textBrightness - bgBrightness) > 50
  );
}