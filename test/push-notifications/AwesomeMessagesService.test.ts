import axios from "axios";
import MockDate from "mockdate";
import {
    AwesomeMessagesService,
    IAwesomeMessage,
} from "../../src/push-notifications/AwesomeMessagesService";

afterEach(() => {
    MockDate.reset();
});

it("returns todays message", async () => {
    MockDate.set("2020-01-01T12:41:12Z");
    const messages: IAwesomeMessage[] = [
        {
            author: "my-author",
            country: "my-country",
            id: "my-id",
            isodate: "2020-01-01",
            text: "my-text",
        },
    ];
    jest.spyOn(axios, "get").mockImplementation(() =>
        Promise.resolve({ data: messages })
    );
    const awesomeMessagesService = new AwesomeMessagesService("my-fake-uri");

    const todaysMessage = await awesomeMessagesService.getTodaysMessage();

    expect(todaysMessage).toEqual({
        text: "my-text",
        authorAndCountry: "my-author from my-country",
    });
});

it("uses the cached messages on 2nd call", async () => {
    MockDate.set("2020-01-01T12:41:12Z");
    const messages: IAwesomeMessage[] = [
        {
            author: "my-author",
            country: "my-country",
            id: "my-id",
            isodate: "2020-01-01",
            text: "my-text",
        },
    ];
    jest.spyOn(axios, "get").mockImplementation(() =>
        Promise.resolve({ data: messages })
    );
    const awesomeMessagesService = new AwesomeMessagesService("my-fake-uri");

    const todaysMessage = await awesomeMessagesService.getTodaysMessage();
    expect(axios.get).toHaveBeenCalledTimes(1);

    const todaysMessage2 = await awesomeMessagesService.getTodaysMessage();
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(todaysMessage).toEqual(todaysMessage2);
});

it("refreshes the cached messages if today not found in non-empty cached messages", async () => {
    MockDate.set("2020-01-01T12:41:12Z");
    const messages: IAwesomeMessage[] = [
        {
            author: "my-author",
            country: "my-country",
            id: "my-id",
            isodate: "2020-01-01",
            text: "my-text",
        },
    ];
    const messages2: IAwesomeMessage[] = [
        messages[0],
        {
            author: "my-author-2",
            country: "my-country-2",
            id: "my-id-2",
            isodate: "2020-01-02",
            text: "my-text-2",
        },
    ];
    let callCount = 0;
    jest.spyOn(axios, "get").mockImplementation(() => {
        if (callCount === 0) {
            callCount++;
            return Promise.resolve({ data: messages });
        }
        return Promise.resolve({ data: messages2 });
    });
    const awesomeMessagesService = new AwesomeMessagesService("my-fake-uri");
    const firstMessage = await awesomeMessagesService.getTodaysMessage(); // set cache
    expect(axios.get).toHaveBeenCalledTimes(1);

    MockDate.set("2020-01-02T03:41:12Z");
    const secondMessage = await awesomeMessagesService.getTodaysMessage();

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(firstMessage).not.toEqual(secondMessage);
    expect(secondMessage).toEqual({
        text: "my-text-2",
        authorAndCountry: "my-author-2 from my-country-2",
    });
});

it("refreshes the cached messages if today not found in non-empty cached messages and falls back to random message", async () => {
    MockDate.set("2020-01-01T12:41:12Z");
    const messages: IAwesomeMessage[] = [
        {
            author: "my-author",
            country: "my-country",
            id: "my-id",
            isodate: "2020-01-01",
            text: "my-text",
        },
    ];
    jest.spyOn(axios, "get").mockImplementation(() =>
        Promise.resolve({ data: messages })
    );
    const awesomeMessagesService = new AwesomeMessagesService("my-fake-uri");
    const firstMessage = await awesomeMessagesService.getTodaysMessage(); // set cache
    expect(axios.get).toHaveBeenCalledTimes(1);

    MockDate.set("2020-01-02T03:41:12Z");
    const secondMessage = await awesomeMessagesService.getTodaysMessage();

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(firstMessage).toEqual(secondMessage);
});

it("ignores invalid messages", async () => {
    MockDate.set("2020-01-01T12:41:12Z");
    const messages: IAwesomeMessage[] = [
        {
            author: "my-author",
            country: "my-country",
            id: "my-id",
            isodate: "1999-11-11",
            text: "my-text",
        },
        // @ts-expect-error
        null,
    ];
    jest.spyOn(axios, "get").mockImplementation(() =>
        Promise.resolve({ data: messages })
    );
    const awesomeMessagesService = new AwesomeMessagesService("my-fake-uri");

    const todaysMessage = await awesomeMessagesService.getTodaysMessage();

    expect(todaysMessage).toEqual({
        text: "my-text",
        authorAndCountry: "my-author from my-country",
    });
});
