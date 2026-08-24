import PublishedPresentation from './PublishedPresentation';
import { Helmet } from 'react-helmet-async';

export const Presentation = () => {
  return (
    <>
      <Helmet><title>Presentación Interactiva | Iglesia Jerusalén</title></Helmet>
      <PublishedPresentation />
    </>
  );
};
