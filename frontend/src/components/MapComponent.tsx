import React, { useEffect } from 'react';
import { message } from 'antd';

interface MapComponentProps {
  onCitySelect: (city: string) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onCitySelect }) => {
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initMap();
      } else {
        setTimeout(checkGoogleMaps, 100);
      }
    };
    checkGoogleMaps();
  }, []);

  const initMap = () => {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const mapInstance = new google.maps.Map(mapElement, {
      center: { lat: 40.7128, lng: -74.0060 },
      zoom: 6,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    let currentMarker: google.maps.Marker | null = null;

    const searchInput = document.getElementById('search-box') as HTMLInputElement;
    const searchBox = new google.maps.places.SearchBox(searchInput);
    
    // Bias the SearchBox results towards current map's viewport
    mapInstance.addListener('bounds_changed', () => {
      searchBox.setBounds(mapInstance.getBounds() as google.maps.LatLngBounds);
    });

    // Handle search box selection
    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();

      if (places && places.length > 0) {
        const place = places[0];
        
        if (place.geometry && place.geometry.location && place.name) {
          if (currentMarker) {
            currentMarker.setMap(null);
          }
          
          currentMarker = new google.maps.Marker({
            position: place.geometry.location,
            map: mapInstance,
            title: place.name,
            animation: google.maps.Animation.DROP
          });
          
          onCitySelect(place.name);
          mapInstance.panTo(place.geometry.location);
          mapInstance.setZoom(10);
        }
      }
    });
    
    // Handle manual search input (Enter key)
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const cityName = searchInput.value.trim();
        if (cityName) {
          onCitySelect(cityName);
        }
      }
    });

    // Handle map clicks
    mapInstance.addListener('click', (event: any) => {
      if (event.latLng) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: event.latLng }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            // Look for a city in the results
            const cityComponent = results[0].address_components?.find(
              (component: any) => component.types.includes('locality')
            );
            
            if (cityComponent) {
              if (currentMarker) {
                currentMarker.setMap(null);
              }
              
              currentMarker = new google.maps.Marker({
                position: event.latLng,
                map: mapInstance,
                title: cityComponent.long_name,
                animation: google.maps.Animation.DROP
              });
              
              // Clear search box when clicking on map
              searchInput.value = '';
              
              onCitySelect(cityComponent.long_name);
              mapInstance.panTo(event.latLng);
            } else {
              message.info('Please click on or near a city name visible on the map');
            }
          }
        });
      }
    });
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <style>
        {`
          .pac-container {
            margin-left: 270px !important;
            margin-top: -35px !important;
          }
        `}
      </style>
      <input
        id="search-box"
        type="text"
        placeholder="Search for a city..."
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          padding: '8px 12px',
          border: '1px solid #434343',
          borderRadius: '4px',
          width: '250px',
          fontSize: '14px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          backgroundColor: '#1f1f1f',
          color: '#ffffff',
        }}
      />
      <div id="map" style={{ height: '100%', borderRadius: '8px' }}></div>
    </div>
  );
};

export default MapComponent;
