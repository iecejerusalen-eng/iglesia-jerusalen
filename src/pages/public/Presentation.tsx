import React from 'react';
import PresentationLayout from '../../components/presentation/PresentationLayout';
import { Helmet } from 'react-helmet-async';

export const Presentation = () => {
  return (
    <>
      <Helmet>
        <title>Presentación Interactiva | Iglesia Jerusalén</title>
      </Helmet>
      <PresentationLayout />
    </>
  );
};
