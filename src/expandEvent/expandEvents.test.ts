/* eslint no-magic-numbers: ["error", {"ignore": [0,1, 5]}] */
import 'jest';
import {
    isNotAtEnd,
    createNewEvent,
    ispe,
    setAttributes,
    expandEvent,
} from './expandEvents';

describe("expand events utility functions", () => {
    it('should be able to determine when we are at the end', () => {
        const start: Date = new Date('2021-03-16T00:00:00');
        const end: Date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
        // eslint-disable-next-line no-magic-numbers
        const endBound: Date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2);
        const recurrenceTotal = 5;

        expect(start < end).toBeTruthy();
        expect(end < endBound).toBeTruthy();
        expect(recurrenceTotal).toBe(5);
        expect(isNotAtEnd(start, end, endBound, recurrenceTotal, 0)).toBe(true);

        // start is after end
        start.setDate(end.getDate() + 1);
        expect(start > end).toBeTruthy();
        expect(end < endBound).toBeTruthy();
        expect(isNotAtEnd(start, end, endBound, recurrenceTotal, 0)).toBe(false);

        end.setDate(endBound.getDate() + 1);
        expect(start < end).toBeTruthy();
        expect(end > endBound).toBeTruthy();
        expect(isNotAtEnd(start, end, endBound, recurrenceTotal, 0)).toBe(false);

        endBound.setDate(end.getDate() + 1);
        expect(start < end).toBeTruthy();
        expect(end < endBound).toBeTruthy();
        /* eslint-disable no-magic-numbers */
        expect(recurrenceTotal).toBe(5);
        expect(isNotAtEnd(start, end, endBound, recurrenceTotal, 1)).toBe(true);
        expect(isNotAtEnd(start, end, endBound, recurrenceTotal, 5)).toBe(false);
        expect(isNotAtEnd(start, end, endBound, recurrenceTotal, 6)).toBe(false);
        /* eslint-enable no-magic-numbers */

        // ignore bound if it is null
        expect(isNotAtEnd(start, end, null, recurrenceTotal, 0)).toBe(true);

        start.setDate(end.getDate() + 1);
        expect(start > end).toBeTruthy();
        expect(isNotAtEnd(start, end, null, recurrenceTotal, 0)).toBe(false);
    });

    it('properly creates a new event with no recurrence data', () => {
        const oldEvent: ispe = {
           fRecurrence: false,
           EventDate: "2021-03-16T00:00:00Z",
           EndDate: "2021-03-16T01:00:00Z",
           Duration: 3600,
           fAllDayEvent: false,
           RecurrenceData: null, 
        };
        const newStartDate = new Date('2021-03-18T00:00:00Z');
        const newEvent = createNewEvent(oldEvent, newStartDate);

        expect(newEvent.fRecurrence).toBe(false);
        expect(newEvent.EventDate).toBe('2021-03-18T00:00:00.000Z');
        expect(newEvent.EndDate).toBe('2021-03-18T01:00:00.000Z');
        expect(newEvent.fAllDayEvent).toBe(false);
        expect(newEvent.RecurrenceData).toBeNull();
        // it occurs to me, this would never run on an event with false recurrence data, but that's okay.
    });
    it('properly creates a new event with recurrence data', () => {
        const recurData = `<recurrence><rule><firstDayOfWeek>su</firstDayOfWeek><repeat><yearlyByDay yearFrequency="1" mo="TRUE" weekdayOfMonth="second" month="2" /></repeat><repeatInstances>10</repeatInstances></rule></recurrence>`;
        const oldEvent: ispe = {
           fRecurrence: true,
           EventDate: "2021-03-16T00:00:00Z",
           EndDate: "2021-03-16T01:00:00Z",
           Duration: 3600,
           fAllDayEvent: false,
           RecurrenceData: recurData,
        };
        const newStartDate = new Date('2021-03-18T00:00:00Z');
        const newEvent = createNewEvent(oldEvent, newStartDate);

        expect(newEvent.fRecurrence).toBe(true);
        expect(newEvent.EventDate).toBe('2021-03-18T00:00:00.000Z');
        expect(newEvent.EndDate).toBe('2021-03-18T01:00:00.000Z');
        expect(newEvent.fAllDayEvent).toBe(false);
        expect(newEvent.RecurrenceData).toBe(recurData);
        // it occurs to me, this would never run on an event with false recurrence data, but that's okay.
    });
    it('properly creates a new all day event with recurrence data', () => {
        const recurData = `<recurrence><rule><firstDayOfWeek>su</firstDayOfWeek><repeat><yearlyByDay yearFrequency="1" mo="TRUE" weekdayOfMonth="second" month="2" /></repeat><repeatInstances>10</repeatInstances></rule></recurrence>`;
        const oldEvent: ispe = {
           fRecurrence: true,
           EventDate: "2021-03-16T00:00:00Z",
           EndDate: "2021-03-16T23:59:00Z",
           Duration: 86340,
           fAllDayEvent: true,
           RecurrenceData: recurData,
        };
        const newStartDate = new Date('2021-03-18T08:00:00Z'); // as if we were in another timezone
        const newEvent = createNewEvent(oldEvent, newStartDate);

        expect(newEvent.fRecurrence).toBe(true);
        expect(newEvent.EventDate).toBe('2021-03-18T00:00:00.000Z');
        expect(newEvent.EndDate).toBe('2021-03-18T23:59:00.000Z');
        expect(newEvent.fAllDayEvent).toBe(true);
        expect(newEvent.RecurrenceData).toBe(recurData);
        // it occurs to me, this would never run on an event with false recurrence data, but that's okay.
    });

    it('can set multiple attributes', () => {
        const ele = setAttributes(document.createElement('div'), [
            ['test', 'one'],
            ['ben', 'clocks'],
            ['darin', 'Rocks'],
        ]);
        expect(ele.hasAttribute('test')).toBe(true);
        expect(ele.getAttribute('test')).toBe('one');
        expect(ele.hasAttribute('ben')).toBe(true);
        expect(ele.getAttribute('ben')).toBe('clocks');
        expect(ele.hasAttribute('darin')).toBe(true);
        expect(ele.getAttribute('darin')).toBe('Rocks');
    });
});

const dailyRecurringEvent = {
  "Id": 12,
  "Title": "daily",
  "Location": null,
  "EventDate": "2021-02-26T00:00:00Z",
  "EndDate": "2021-03-07T00:30:00Z",
  "Description": "<p>​daily<br></p><p>every 1 day</p><p>start date&#58; 2/25/2021<br></p><p>end after 10 occurences<br></p>",
  "fAllDayEvent": false,
  "fRecurrence": true,
  "Duration": 1800,
  "RecurrenceData": "<recurrence><rule><firstDayOfWeek>su</firstDayOfWeek><repeat><daily dayFrequency=\"1\" /></repeat><repeatInstances>10</repeatInstances></rule></recurrence>",
  "Category": "Holiday",
  "BIC_DateSelection": "Specific Date",
  "BIC_Contact": null,
  "ID": 12,
  "Attachments": false,
  "AttachmentFiles": [],
};

const marchRecurringEvent = {
  "Id": 12,
  "Title": "daily",
  "Location": null,
  "EventDate": "2022-03-28T00:00:00Z",
  "EndDate": "2023-05-07T00:30:00Z",
  "Description": "<p>​daily<br></p><p>every 1 day</p><p>start date&#58; 2/25/2021<br></p><p>end after 10 occurences<br></p>",
  "fAllDayEvent": false,
  "fRecurrence": true,
  "Duration": 1800,
  "RecurrenceData": "<recurrence><rule><firstDayOfWeek>su</firstDayOfWeek><repeat><daily dayFrequency=\"1\" /></repeat><repeatInstances>10</repeatInstances></rule></recurrence>",
  "Category": "Holiday",
  "BIC_DateSelection": "Specific Date",
  "BIC_Contact": null,
  "ID": 12,
  "Attachments": false,
  "AttachmentFiles": [],
};

const monthRecurringEvent = {
  "Id": 4,
  "Title": "mothly recurring event",
  "Location": null,
  "EventDate": "2021-02-06T10:00:00Z",
  "EndDate": "2021-11-16T10:00:00Z",
  "Description": "<p>​Day 5 of every month<br></p>",
  "fAllDayEvent": false,
  "fRecurrence": true,
  "Duration": 3600,
  "RecurrenceData": "<recurrence><rule><firstDayOfWeek>su</firstDayOfWeek><repeat><monthly monthFrequency=\"1\" day=\"5\" /></repeat><repeatInstances>10</repeatInstances></rule></recurrence>",
  "Category": "Holiday",
  "BIC_DateSelection": "Specific Date",
  "BIC_Contact": null,
  "ID": 4,
  "Attachments": false,
  "AttachmentFiles": [],
};

const monthByDayEvent = {
  "Id": 5,
  "Title": "friday monthly by day recurring event",
  "Location": null,
  "EventDate": "2021-02-13T01:00:00Z",
  "EndDate": "2104-04-19T01:00:00Z",
  "Description": "<p>​the third friday of every month<br></p>",
  "fAllDayEvent": false,
  "fRecurrence": true,
  "Duration": 3600,
  "RecurrenceData": "<recurrence><rule><firstDayOfWeek>su</firstDayOfWeek><repeat><monthlyByDay fr=\"TRUE\" weekdayOfMonth=\"third\" monthFrequency=\"1\" /></repeat><repeatForever>FALSE</repeatForever></rule></recurrence>",
  "Category": "Meeting",
  "BIC_DateSelection": "Specific Date",
  "BIC_Contact": null,
  "ID": 5,
  "Attachments": false,
  "AttachmentFiles": [],
};

const yearEvent = {
  "Id": 8,
  "Title": "yearly recurring event",
  "Location": null,
  "EventDate": "2021-02-17T01:00:00Z",
  "EndDate": "2170-02-17T02:00:00Z",
  "Description": "<p>​occurs every Feb 16<br></p>",
  "fAllDayEvent": false,
  "fRecurrence": true,
  "Duration": 3600,
  "RecurrenceData": "<recurrence><rule><firstDayOfWeek>su</firstDayOfWeek><repeat><yearly yearFrequency=\"1\" month=\"2\" day=\"16\" /></repeat><repeatForever>FALSE</repeatForever></rule></recurrence>",
  "Category": "Holiday",
  "BIC_DateSelection": "Specific Date",
  "BIC_Contact": null,
  "ID": 8,
  "Attachments": false,
  "AttachmentFiles": [],
};

const weekDayEvent = {
  "Id": 9,
  "Title": "weekday recurring",
  "Location": null,
  "EventDate": "2021-02-22T20:00:00Z",
  "EndDate": "2024-12-19T21:00:00Z",
  "Description": null,
  "fAllDayEvent": false,
  "fRecurrence": true,
  "Duration": 3600,
  "RecurrenceData": "<recurrence><rule><firstDayOfWeek>su</firstDayOfWeek><repeat><daily weekday=\"TRUE\" /></repeat><repeatForever>FALSE</repeatForever></rule></recurrence>",
  "Category": "Work hours",
  "BIC_DateSelection": "Specific Date",
  "BIC_Contact": null,
  "ID": 9,
  "Attachments": false,
  "AttachmentFiles": [],
};

const marchWeekDayEvent = {
  "Id": 9,
  "Title": "weekday recurring",
  "Location": null,
  "EventDate": "2022-03-24T20:00:00Z",
  "EndDate": "2022-03-30T21:00:00Z",
  "Description": null,
  "fAllDayEvent": false,
  "fRecurrence": true,
  "Duration": 3600,
  "RecurrenceData": "<recurrence><rule><firstDayOfWeek>su</firstDayOfWeek><repeat><daily weekday=\"TRUE\" /></repeat><repeatForever>FALSE</repeatForever></rule></recurrence>",
  "Category": "Work hours",
  "BIC_DateSelection": "Specific Date",
  "BIC_Contact": null,
  "ID": 9,
  "Attachments": false,
  "AttachmentFiles": [],
};

const yearByDayEvent = {
  "Id": 18,
  "Title": "year by day",
  "Location": null,
  "EventDate": "2021-02-19T00:00:00Z",
  "EndDate": "2031-02-07T01:00:00Z",
  "Description": null,
  "fAllDayEvent": false,
  "fRecurrence": true,
  "Duration": 3600,
  "RecurrenceData": "<recurrence><rule><firstDayOfWeek>su</firstDayOfWeek><repeat><yearlyByDay yearFrequency=\"1\" th=\"TRUE\" weekdayOfMonth=\"first\" month=\"2\" /></repeat><repeatInstances>10</repeatInstances></rule></recurrence>",
  "Category": null,
  "BIC_DateSelection": "Specific Date",
  "BIC_Contact": null,
  "ID": 18,
  "Attachments": false,
  "AttachmentFiles": [],
};

describe('expand events function', () => {
    it('weekday events respect end dates when expanded', () => {
        // daily recurrence events
        const expandedEvents = expandEvent(marchRecurringEvent);
        const expandedDates = expandedEvents.map(event => event.EventDate);
        expect(expandedDates).not.toContain('2022-03-32T00:00:00.000Z')

        // the daily weekday node creates a weekly node, so this checks for issue #11
        // weekday recurrence with bounds
        const expandedBoundedWeekdayEvents = expandEvent(marchWeekDayEvent, {end: new Date('2022-03-31T22:00:00Z'), start: null});
        const expandedBoundedWeekdayDates = expandedBoundedWeekdayEvents.map(event => event.EventDate);
        expect(expandedBoundedWeekdayDates).not.toContain('2022-04-01T20:00:00.000Z');

        // weekday recurrence without bounds
        const expandedWeekdayEvents = expandEvent(marchWeekDayEvent);
        const expandedWeekdayDates = expandedWeekdayEvents.map(event => event.EventDate);
        expect(expandedWeekdayDates).not.toContain('2022-04-01T20:00:00.000Z');
    })
    it('daily recurrence', () => {
        const expandedEvents = expandEvent(dailyRecurringEvent);
        expect(expandedEvents.length).toBe(10); // eslint-disable-line no-magic-numbers
    });
    it('monthly recurrence', () => {
        // unbounded
        const expandedEvents = expandEvent(monthRecurringEvent);
        expect(expandedEvents.length).toBe(10); // eslint-disable-line no-magic-numbers

        // one month
        const oneMonth = expandEvent(monthRecurringEvent, {start: null, end: new Date('2021-03-01T00:00:00Z')});
        expect(oneMonth.length).toBe(1);
    });
    it('does not recur', () => {
        const event: ispe = {
            fRecurrence: false,
            EventDate: new Date().toISOString(),
            EndDate: new Date().toISOString(),
            fAllDayEvent: false,
            Duration: 1800,
            RecurrenceData: null,
        };
        const expandedEvents = expandEvent(event);
        expect(expandedEvents.length).toBe(1);
    });
    it('recurs monthly by day', () => {
        const expandedEvents = expandEvent(monthByDayEvent);
        expect(expandedEvents.length).toBe(999); // eslint-disable-line no-magic-numbers

        const bounded = expandEvent(monthByDayEvent, {start: new Date('2022-05-01T00:00:00Z'), end: new Date('2022-07-01T00:00:00Z')});
        expect(bounded.length).toBe(2); //eslint-disable-line no-magic-numbers
    });
    it('year recurrence', () => {
        const expandedEvents = expandEvent(yearEvent);
        expect(expandedEvents.length).toBe(150); // eslint-disable-line no-magic-numbers

        const bounded = expandEvent(yearEvent, {start: new Date('2023-01-01T00:00:00Z'), end: new Date('2023-03-01T00:00:00Z')});
        expect(bounded.length).toBe(1);
    });
    it('weekday recurrence', () => {
        const expandedEvents = expandEvent(weekDayEvent);
        expect(expandedEvents.length).toBe(999); // eslint-disable-line no-magic-numbers
        expect(expandedEvents[expandedEvents.length - 1]).toMatchObject({EndDate: new Date(weekDayEvent.EndDate).toISOString()})

        const bounded = expandEvent(weekDayEvent, {start: new Date('2023-01-01T00:00:00Z'), end: new Date('2023-03-01T00:00:00Z')});
        
        expect(bounded.length).toBe(42); // eslint-disable-line no-magic-numbers
        expect(bounded[bounded.length - 1]).toMatchObject({EventDate: '2023-02-28T20:00:00.000Z'});
    });
    it('year by day recurrence', () => {
        const expandedEvents = expandEvent(yearByDayEvent);
        expect(expandedEvents.length).toBe(10); // eslint-disable-line no-magic-numbers

        const bounded = expandEvent(yearByDayEvent, {start: new Date('2023-01-01T00:00:00Z'), end: new Date('2023-03-01T00:00:00Z')});
        expect(bounded.length).toBe(1); // eslint-disable-line no-magic-numbers
    });
});