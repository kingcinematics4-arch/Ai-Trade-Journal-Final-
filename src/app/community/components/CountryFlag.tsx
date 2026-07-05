import React from 'react';
import ReactCountryFlag from 'react-country-flag';

interface CountryFlagProps {
  country: string;
  className?: string;
}

const COUNTRY_CODE_MAP: Record<string, string> = {
  Afghanistan: 'AF',
  Albania: 'AL',
  Algeria: 'DZ',
  Argentina: 'AR',
  Australia: 'AU',
  Austria: 'AT',
  Bangladesh: 'BD',
  Belgium: 'BE',
  Brazil: 'BR',
  Canada: 'CA',
  Chile: 'CL',
  China: 'CN',
  Colombia: 'CO',
  Croatia: 'HR',
  'Czech Republic': 'CZ',
  Denmark: 'DK',
  Egypt: 'EG',
  Finland: 'FI',
  France: 'FR',
  Germany: 'DE',
  Ghana: 'GH',
  Greece: 'GR',
  Hungary: 'HU',
  India: 'IN',
  Indonesia: 'ID',
  Iran: 'IR',
  Iraq: 'IQ',
  Ireland: 'IE',
  Israel: 'IL',
  Italy: 'IT',
  Japan: 'JP',
  Jordan: 'JO',
  Kenya: 'KE',
  Malaysia: 'MY',
  Mexico: 'MX',
  Morocco: 'MA',
  Netherlands: 'NL',
  'New Zealand': 'NZ',
  Nigeria: 'NG',
  Norway: 'NO',
  Pakistan: 'PK',
  Peru: 'PE',
  Philippines: 'PH',
  Poland: 'PL',
  Portugal: 'PT',
  Romania: 'RO',
  Russia: 'RU',
  'Saudi Arabia': 'SA',
  Singapore: 'SG',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  Spain: 'ES',
  'Sri Lanka': 'LK',
  Sweden: 'SE',
  Switzerland: 'CH',
  Thailand: 'TH',
  Turkey: 'TR',
  UAE: 'AE',
  Ukraine: 'UA',
  'United Kingdom': 'GB',
  'United States': 'US',
  Venezuela: 'VE',
  Vietnam: 'VN',
};

export function getCountryCode(country: string): string {
  return COUNTRY_CODE_MAP[country] || '';
}

export const CountryFlag = ({ country, className }: CountryFlagProps) => {
  const countryCode = getCountryCode(country);

  if (!countryCode) return null;

  return (
    <ReactCountryFlag
      countryCode={countryCode}
      svg
      style={{
        width: '24px',
        height: '18px',
        borderRadius: '2px',
      }}
      className={`flex-shrink-0 ${className || ''}`}
    />
  );
};
