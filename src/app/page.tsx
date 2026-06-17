// import MaintenancePage from "./maintenance/page";

// export default function Home() {
//   return <MaintenancePage />;
// }
import LandingPage from './LandingPage';
import AuthScreen from './components/AuthScreen'; 

export default function Page() {
  return (
    <>
      <LandingPage />
      <AuthScreen />
    </>
  );
}