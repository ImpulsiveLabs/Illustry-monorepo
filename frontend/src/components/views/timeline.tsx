'use client';

import { getStoredTheme } from '@/lib/theme-mode';
import { FC, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { VisualizationTypes } from '@illustry/types';
import { VerticalTimeline, VerticalTimelineProps } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { WithFullScreen, WithLegend, WithOptions } from '@/lib/types/utils';
import TimelineAccordion from './timeline/timelineAccordion';
import TimelineElement from './timeline/timelineElement';

type TimelineProp = {
  data: VisualizationTypes.TimelineData;
} & WithLegend
  & WithOptions
  & WithFullScreen;

const TimelineView = ({ data, fullScreen }: TimelineProp) => {
  const isDarkTheme = getStoredTheme() === 'dark';
  const { ref, inView } = useInView({
    triggerOnce: true
  });
  const sortedKeys = Object.keys(data).sort();

  const elementsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(0);

  const startIndex = currentPage * elementsPerPage;
  const endIndex = startIndex + elementsPerPage;
  const displayedDates = sortedKeys.slice(startIndex, endIndex);
  const VerticalTimelineFC = VerticalTimeline as unknown as FC<VerticalTimelineProps>;
  const maxPage = Math.max(0, Math.ceil(sortedKeys.length / elementsPerPage) - 1);
  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, maxPage));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div
      className={`mt-5 mx-auto p-2 sm:p-4 lg:p-6 ${!fullScreen ? 'h-[50vh] overflow-y-auto' : ''}`}
      ref={ref}
    >
      <VerticalTimelineFC
        layout="1-column-left"
        animate={true}
        lineColor={!isDarkTheme ? 'rgb(245, 245, 245)' : 'rgb(66, 66, 66)'}
      >
        {displayedDates.map((date) => (
          <TimelineElement date={date} isDarkTheme={isDarkTheme} inView={inView} key={date}>
            <h3 className="vertical-timeline-element-title text-gray-700
             dark:text-gray-400 text-center my-1 text-sm sm:text-lg md:text-lg">
              {data[date]?.summary?.title}
            </h3>
            <span className="capitalize font-medium text-gray-700 dark:text-gray-400 text-xs sm:text-sm">
              {formatDate(date)}
            </span>
            <TimelineAccordion data={data} date={date} />
          </TimelineElement>
        ))}
      </VerticalTimelineFC>
      <div className="flex justify-center mt-4 mb-6">
        <Button
          suppressHydrationWarning
          aria-label="Go to previous page"
          variant="outline"
          size="icon"
          className="hidden h-6 w-6 lg:flex"
          onClick={handlePreviousPage}
          disabled={currentPage === 0}
        >
          <ChevronLeftIcon className="h-3 w-3" aria-hidden="true" />
        </Button>
        <Button
          suppressHydrationWarning
          aria-label="Go to next page"
          variant="outline"
          size="icon"
          className="h-6 w-6"
          onClick={handleNextPage}
          disabled={endIndex >= sortedKeys.length}
        >
          <ChevronRightIcon className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};

export default TimelineView;
