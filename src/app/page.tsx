// import MaintenancePage from "./maintenance/page";

// export default function Home() {
//   return <MaintenancePage />;
// }
import LandingPage from './LandingPage';
import LandingNavbar from '@/components/LandingNavbar';

export default function Page() {
  return (
    <>
      <LandingNavbar />
      <LandingPage />
    </>
  );
}