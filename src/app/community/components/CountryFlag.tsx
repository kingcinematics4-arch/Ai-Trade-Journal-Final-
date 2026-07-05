import React from 'react';

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

function getEmojiFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '';

  const base = 127462;
  const codePoint1 = countryCode.toUpperCase().charCodeAt(0);
  const codePoint2 = countryCode.toUpperCase().charCodeAt(1);

  return String.fromCodePoint(base + codePoint1) + String.fromCodePoint(base + codePoint2);
}

export function getCountryFlagEmoji(country: string): string {
  const code = COUNTRY_CODE_MAP[country];
  if (!code) return '';
  return getEmojiFlag(code);
}

export const CountryFlag = ({ country, className }: CountryFlagProps) => {
  const flagEmoji = getCountryFlagEmoji(country);

  if (!flagEmoji) return null;

  return (
    <span className={`text-xl leading-none ${className || ''}`} aria-label={`${country} flag`}>
      {flagEmoji}
    </span>
  );
};
