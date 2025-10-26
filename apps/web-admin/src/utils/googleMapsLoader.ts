// Global Google Maps API loader to prevent multiple script loads
// and ensure proper initialization order

const GOOGLE_PLACES_API_KEY = (import.meta as any).env.VITE_GOOGLE_PLACES_API_KEY || '';

declare global {
  interface Window {
    google: any;
    googleMapsLoadingPromise?: Promise<void>;
  }
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loadingPromise: Promise<void> | null = null;
  private isLoaded = false;

  private constructor() {}

  public static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  public async loadGoogleMaps(): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded && window.google && window.google.maps && window.google.maps.places) {
      return Promise.resolve();
    }

    // If already loading, return the existing promise
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Check if API key is available
    if (!GOOGLE_PLACES_API_KEY) {
      const error = new Error('Google Places API key not found. Please set VITE_GOOGLE_PLACES_API_KEY in your environment variables.');
      console.error(error.message);
      return Promise.reject(error);
    }

    // Start loading
    this.loadingPromise = this.loadScript();
    return this.loadingPromise;
  }

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already in the DOM
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Script exists, wait for it to load
        const checkGoogle = () => {
          if (window.google && window.google.maps && window.google.maps.places) {
            this.isLoaded = true;
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Wait a bit for the API to be fully initialized
        setTimeout(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            this.isLoaded = true;
            console.log('✅ Google Maps API loaded successfully');
            resolve();
          } else {
            reject(new Error('Google Maps API failed to initialize properly'));
          }
        }, 100);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Google Maps API:', error);
        reject(new Error('Failed to load Google Maps API script'));
      };
      
      document.head.appendChild(script);
    });
  }

  public isGoogleMapsLoaded(): boolean {
    return this.isLoaded && window.google && window.google.maps && window.google.maps.places;
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance();
