import HomeContainer from "@/containers/home";

/**
 * HomePage Component.
 * Pure entry point — renders the 3D masterplan container.
 *
 * `active` is supplied by containers/keep-alive-outlet: this page stays mounted
 * after its first visit and is hidden rather than unmounted, so the container
 * needs to know when to stop its render loop. It MUST be forwarded.
 */
const HomePage = ({ active = true }) => {
  return <HomeContainer active={active} />;
};

export default HomePage;
