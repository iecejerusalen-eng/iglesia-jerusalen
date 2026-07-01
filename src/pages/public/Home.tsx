import { useEffect } from 'react';
import TestimonialsSection from '../../components/public/TestimonialsSection';
import { useHomeData } from '../../features/home/hooks/useHomeData';
import { HeroSection } from '../../features/home/components/HeroSection';
import { StatsSection } from '../../features/home/components/StatsSection';
import { WelcomeSection } from '../../features/home/components/WelcomeSection';
import { DailyVerseSection } from '../../features/home/components/DailyVerseSection';
import { SchedulesSection } from '../../features/home/components/SchedulesSection';
import { EventsSection } from '../../features/home/components/EventsSection';
import { SermonsSection } from '../../features/home/components/SermonsSection';
import { BirthdaysSection } from '../../features/home/components/BirthdaysSection';
import { GenericSection } from '../../features/home/components/GenericSection';
import { DonationsSection } from '../../features/home/components/DonationsSection';
import { CtaBanner } from '../../features/home/components/CtaBanner';
import { ImageGallerySection } from '../../components/public/ImageGallerySection';
import { Helmet } from 'react-helmet-async';
import { DEFAULT_SECTIONS } from '../../features/home/constants';
import type { PageSection } from '../../features/home/types';

const Home = () => {
  const {
    sections,
    schedules,
    sermons,
    events,
    stats,
    birthdayMembers,
    loadingSchedules,
    loadingSermons,
    loadingEvents
  } = useHomeData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Iglesia Jerusalén | Inicio</title>
        <meta name="description" content="Bienvenido a la Iglesia Jerusalén. Únete a nuestra comunidad, descubre nuestros ministerios y acompáñanos en nuestros eventos y servicios." />
        <meta property="og:title" content="Iglesia Jerusalén" />
        <meta property="og:description" content="Bienvenido a la Iglesia Jerusalén. Únete a nuestra comunidad, descubre nuestros ministerios y acompáñanos en nuestros eventos y servicios." />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen space-y-16 pb-20">
        {sections.map((section: PageSection) => {
        const { id, section_type, title, subtitle, content_blocks } = section;

        switch (section_type) {
          case 'custom':
            if (id === 'home_hero') {
              return <HeroSection key={id} sectionData={section} />;
            }
            if (id === 'home_welcome') {
              return (
                <div key={id} className="flex flex-col">
                  <WelcomeSection sectionData={section} />
                  <DailyVerseSection />
                </div>
              );
            }
            if (id === 'home_donations') {
              return <DonationsSection key={id} sectionData={section} />;
            }
            return <GenericSection key={id} sectionData={section} />;

          case 'system_schedules':
            return (
              <SchedulesSection 
                key={id} 
                sectionData={section} 
                schedules={schedules} 
                loading={loadingSchedules} 
              />
            );

          case 'system_events':
            return (
              <EventsSection 
                key={id} 
                sectionData={section} 
                events={events} 
                loading={loadingEvents} 
              />
            );

          case 'system_sermons':
            return (
              <SermonsSection 
                key={id} 
                sectionData={section} 
                sermons={sermons} 
                loading={loadingSermons} 
              />
            );

          case 'system_birthdays':
            return (
              <BirthdaysSection 
                key={id} 
                sectionData={section} 
                birthdayMembers={birthdayMembers} 
              />
            );

          case 'system_gallery':
            return (
              <ImageGallerySection
                key={id}
                title={title || ''}
                subtitle={subtitle || ''}
                slides={(content_blocks && content_blocks.length > 0) ? content_blocks : (DEFAULT_SECTIONS.find(s => s.id === 'home_gallery')?.content_blocks || [])}
              />
            );

          default:
            return null;
        }
      })}

      <StatsSection stats={stats} />
      
      <TestimonialsSection />

      <CtaBanner />
      </div>
    </>
  );
};

export default Home;
