export declare const tokens: {
  colors: Record<string, string>;
  spacing: Record<string, number>;
  radius: Record<string, number>;
  shadow: Record<string, {
    elevation: number;
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
  }>;
  fontFamily: {
    sans: string;
    medium: string;
    semibold: string;
    bold: string;
    target: string;
  };
  typography: Record<string, {
    fontSize: number;
    lineHeight: number;
    fontWeight: string;
    letterSpacing: number;
  }>;
};
