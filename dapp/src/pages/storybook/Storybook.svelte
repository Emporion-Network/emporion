<script lang="ts">
    import type { ChangeEventHandler } from "svelte/elements";
    import Table from "../../lib/Table.svelte";
    import Wraper from "./Wraper.svelte";
    import Select from "../../lib/Select.svelte";
    let items = [
        {
            checked: false,
            number: 1,
            name: "Oussama Hamdaoui",
            country: "fr",
            amount: 1234,
            status: "pending",
        },
        {
            checked: true,
            number: 2,
            name: "Jhon",
            country: "us",
            amount: 42,
            status: "accepted",
        },
        {
            checked: false,
            number: 3,
            name: "Alice",
            country: "gr",
            amount: 69,
            status: "pending",
        },
        {
            checked: false,
            number: 4,
            name: "Bob",
            country: "es",
            amount: 333,
            status: "accepted",
        },
        {
            checked: false,
            number: 5,
            name: "Eve",
            country: "fr",
            amount: 666,
            status: "pending",
        },
    ];

    const sortByString =
        (key: keyof (typeof items)[number]) =>
        (a: (typeof items)[number], b: (typeof items)[number]) => {
            return a[key].toString().localeCompare(b[key].toString());
        };
    const sortByNum =
        (key: keyof (typeof items)[number]) =>
        (a: (typeof items)[number], b: (typeof items)[number]) => {
            return Number(a[key]) - Number(b[key]);
        };
    const sortByName = sortByString("name");
    const sortByCountry = sortByString("country");
    const sortById = sortByNum("number");
    const sortByPrice = sortByNum("amount");

    const checkItem: (
        item: (typeof items)[number],
    ) => ChangeEventHandler<HTMLInputElement> = (item) => (e) => {
        let i = items.find((i) => i == item)!;
        i.checked = e.currentTarget.checked;
    };

    const selectAll: ChangeEventHandler<HTMLInputElement> = (e) => {
        items.forEach((i) => {
            i.checked = e.currentTarget.checked;
        });
        items = items;
    };

    const icon = {
        "0": "ri-expand-up-down-line",
        undefined: "ri-expand-up-down-line",
        "1": "ri-arrow-up-s-line",
        "-1": "ri-arrow-down-s-line",
    } as { [key: string]: string };
    const statusFilters = {
        all: (_:typeof items[number])=>true,
        pending: (t:typeof items[number])=>t.status === 'pending',
        accepted:  (t:typeof items[number])=>t.status === 'accepted',
        rejected:  (t:typeof items[number])=>t.status === 'rejected',
    }
    let filter = statusFilters['all'];
    
</script>

<Wraper>
    <Table index="name" rows={items} bind:filter>
        <svelte:fragment slot="head" let:sort let:sorts>
            <div class="small">
                <input type="checkbox" on:change={selectAll} />
            </div>
            <button on:click={() => sort(sortById)}>
                <i class={icon[`${sorts.get(sortById)}`]}></i>
                Number
            </button>
            <button on:click={() => sort(sortByName)}>
                <i class={icon[`${sorts.get(sortByName)}`]}></i>
                Name
            </button>
            <button on:click={() => sort(sortByCountry)}>
                <i class={icon[`${sorts.get(sortByCountry)}`]}></i>
                Country
            </button>
            <button on:click={() => sort(sortByPrice)}>
                <i class={icon[`${sorts.get(sortByPrice)}`]}></i>
                Amount
            </button>
            <Select bind:selected={filter}>
                <svelte:fragment slot="selected" let:selected>
                    {Object.entries(statusFilters).find(([k, v]) => v === selected)?.[0]}
                </svelte:fragment>
                <svelte:fragment slot="options" let:select>
                    <button on:click={select(statusFilters['pending'])}>Pending</button>
                    <button on:click={select(statusFilters['accepted'])} >Accepted</button>
                    <button on:click={select(statusFilters['rejected'])}>Rejected</button>
                    <button on:click={select(statusFilters['all'])}>All</button>
                </svelte:fragment>
            </Select>
        </svelte:fragment>
        <svelte:fragment slot="item" let:item>
            <div class="small">
                <input
                    type="checkbox"
                    on:change={checkItem(item)}
                    checked={item.checked}/>
            </div>
            <div>{item.number}</div>
            <div>{item.name}</div>
            <div>{item.country}</div>
            <div>{item.amount}</div>
            <div>{item.status}</div>
        </svelte:fragment>
    </Table>
</Wraper>

<style lang="scss">
    .small {
        max-width: 70px;
    }
</style>
