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
import { BentoGridSection } from '../../features/home/components/BentoGridSection';
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
      <div className="relative min-h-screen space-y-20 overflow-hidden bg-slate-50 pb-24 transition-colors dark:bg-slate-950 md:space-y-24">
        <div aria-hidden="true" className="pointer-events-none absolute left-[-12rem] top-[50rem] h-[32rem] w-[32rem] rounded-full bg-amber-300/10 blur-[120px] dark:bg-amber-500/5" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[-14rem] top-[90rem] h-[36rem] w-[36rem] rounded-full bg-indigo-300/10 blur-[130px] dark:bg-indigo-500/5" />
        {sections.map((section: PageSection) => {
        const { id, section_type, title, subtitle, content_blocks } = section;

        switch (section_type) {
          case 'custom':
            if (id === 'home_hero') {
              return (
                <div key={id} id={id} className="flex flex-col">
                  <HeroSection sectionData={section} />
                  <BentoGridSection latestSermon={sermons[0]} nextEvent={events[0]} />
                </div>
              );
            }
            if (id === 'home_welcome') {
              return (
                <div key={id} id={id} className="flex flex-col">
                  <WelcomeSection sectionData={section} />
                  <DailyVerseSection />
                </div>
              );
            }
            if (id === 'home_donations') {
              return (
                <div key={id} id={id}>
                  <DonationsSection sectionData={section} />
                </div>
              );
            }
            return (
              <div key={id} id={id}>
                <GenericSection sectionData={section} />
              </div>
            );

          case 'system_schedules':
            return (
              <div key={id} id={id}>
                <SchedulesSection 
                  sectionData={section} 
                  schedules={schedules} 
                  loading={loadingSchedules} 
                />
              </div>
            );

          case 'system_events':
            return (
              <div key={id} id={id}>
                <EventsSection 
                  sectionData={section} 
                  events={events} 
                  loading={loadingEvents} 
                />
              </div>
            );

          case 'system_sermons':
            return (
              <div key={id} id={id}>
                <SermonsSection 
                  sectionData={section} 
                  sermons={sermons} 
                  loading={loadingSermons} 
                />
              </div>
            );

          case 'system_birthdays':
            return (
              <div key={id} id={id}>
                <BirthdaysSection 
                  sectionData={section} 
                  birthdayMembers={birthdayMembers} 
                />
              </div>
            );

          case 'system_gallery':
            return (
              <div key={id} id={id}>
                <ImageGallerySection
                  title={title || ''}
                  subtitle={subtitle || ''}
                  slides={(content_blocks && content_blocks.length > 0) ? content_blocks : (DEFAULT_SECTIONS.find(s => s.id === 'home_gallery')?.content_blocks || [])}
                />
              </div>
            );

          default:
            return null;
        }
      })}

      <div id="stats_section">
        <StatsSection stats={stats} />
      </div>
      
      <div id="testimonials_section">
        <TestimonialsSection />
      </div>

      <CtaBanner />
      </div>
    </>
  );
};

export default Home;
