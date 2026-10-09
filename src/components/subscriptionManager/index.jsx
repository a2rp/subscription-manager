import { useEffect, useMemo, useState } from "react";
import { FiActivity, FiBookOpen, FiCalendar, FiCloud, FiCreditCard, FiGrid, FiPause, FiPlay, FiPlus, FiRepeat, FiSearch, FiTrash2, FiVideo } from "react-icons/fi";
import ConfirmDialog from "../confirmDialog";
import styles from "./styles.module.css";

const storageKey = "repeatr-subscriptions";
const dateAt = (offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};
const samples = [
    { id: 1, name: "Netflix", category: "Entertainment", amount: 649, cycle: "Monthly", nextDate: dateAt(3), status: "Active", detail: "Standard plan", color: "red" },
    { id: 2, name: "Spotify", category: "Entertainment", amount: 119, cycle: "Monthly", nextDate: dateAt(6), status: "Active", detail: "Individual plan", color: "green" },
    { id: 3, name: "Adobe Creative Cloud", category: "Productivity", amount: 1675, cycle: "Monthly", nextDate: dateAt(12), status: "Active", detail: "All apps", color: "orange" },
    { id: 4, name: "iCloud+", category: "Storage", amount: 75, cycle: "Monthly", nextDate: dateAt(18), status: "Active", detail: "200 GB storage", color: "blue" },
    { id: 5, name: "Prime Video", category: "Entertainment", amount: 1499, cycle: "Yearly", nextDate: dateAt(35), status: "Active", detail: "Annual plan", color: "cyan" },
    { id: 6, name: "The Daily Edit", category: "Reading", amount: 249, cycle: "Monthly", nextDate: dateAt(22), status: "Paused", detail: "Digital access", color: "violet" },
    { id: 7, name: "Move with Mira", category: "Wellness", amount: 3999, cycle: "Yearly", nextDate: dateAt(54), status: "Active", detail: "Studio membership", color: "lime" },
];
const iconByCategory = { Entertainment: FiVideo, Productivity: FiGrid, Storage: FiCloud, Reading: FiBookOpen, Wellness: FiActivity };
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const monthlyCost = (item) => {
    const amount = Number(item.amount) || 0;
    if (item.cycle === "Weekly") return amount * 52 / 12;
    if (item.cycle === "Quarterly") return amount / 3;
    if (item.cycle === "Yearly") return amount / 12;
    return amount;
};
const readSubscriptions = () => {
    try {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : samples;
    } catch {
        return samples;
    }
};
const daysUntil = (dateValue) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateValue + "T12:00:00");
    return Math.ceil((due.getTime() - today.getTime()) / 86400000);
};
const readableDate = (dateValue) => new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(dateValue + "T12:00:00"));

const SubscriptionManager = () => {
    const [subscriptions, setSubscriptions] = useState(readSubscriptions);
    const [filter, setFilter] = useState("All services");
    const [search, setSearch] = useState("");
    const [pendingDelete, setPendingDelete] = useState(null);
    const [draft, setDraft] = useState({ name: "", category: "Entertainment", amount: "", cycle: "Monthly", nextDate: dateAt(30), detail: "" });
    useEffect(() => localStorage.setItem(storageKey, JSON.stringify(subscriptions)), [subscriptions]);

    const active = subscriptions.filter((item) => item.status === "Active");
    const monthlyTotal = active.reduce((sum, item) => sum + monthlyCost(item), 0);
    const annualTotal = monthlyTotal * 12;
    const upcoming = [...active].sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    const visible = useMemo(() => subscriptions
        .filter((item) => filter === "All services" || item.status === filter)
        .filter((item) => (item.name + " " + item.category + " " + item.detail).toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.nextDate.localeCompare(b.nextDate)), [subscriptions, filter, search]);
    const categoryTotals = active.reduce((totals, item) => {
        totals[item.category] = (totals[item.category] || 0) + monthlyCost(item);
        return totals;
    }, {});
    const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const soonCount = upcoming.filter((item) => daysUntil(item.nextDate) >= 0 && daysUntil(item.nextDate) <= 7).length;

    const addSubscription = (event) => {
        event.preventDefault();
        if (!draft.name.trim() || Number(draft.amount) <= 0) return;
        const palette = ["red", "green", "orange", "blue", "cyan", "violet", "lime"];
        setSubscriptions((current) => [...current, {
            ...draft,
            id: Date.now(),
            name: draft.name.trim(),
            amount: Number(draft.amount),
            status: "Active",
            color: palette[current.length % palette.length],
            detail: draft.detail.trim() || draft.cycle + " plan",
        }]);
        setDraft({ name: "", category: "Entertainment", amount: "", cycle: "Monthly", nextDate: dateAt(30), detail: "" });
    };
    const toggleStatus = (id) => setSubscriptions((current) => current.map((item) => item.id === id ? { ...item, status: item.status === "Active" ? "Paused" : "Active" } : item));
    const removeSubscription = () => {
        setSubscriptions((current) => current.filter((item) => item.id !== pendingDelete.id));
        setPendingDelete(null);
    };

    return <section className={styles.subscriptionManager}>
        <div className={styles.hero}>
            <div><p className={styles.context}>YOUR RECURRING BILLS, AT A GLANCE</p><h1>Know what<br /><span>keeps coming.</span></h1><p className={styles.description}>A clear view of every plan, price, and next renewal.</p></div>
            <div className={styles.monthlyCard}><div className={styles.monthlyIcon}><FiRepeat aria-hidden="true" /></div><div><span>MONTHLY COMMITMENT</span><strong>{money(monthlyTotal)}</strong><small>{money(annualTotal)} annualized across {active.length} active services</small></div><a href="#add" className={styles.addShortcut}>Add a service <FiPlus aria-hidden="true" /></a></div>
        </div>

        <div className={styles.stats}>
            <article><span>Active services</span><strong>{active.length}<small> / {subscriptions.length} tracked</small></strong><p>Currently billing</p></article>
            <article><span>Next 7 days</span><strong>{soonCount}<small> renewals</small></strong><p>{soonCount ? "Check the upcoming charges" : "No charges due this week"}</p></article>
            <article><span>Annual outlook</span><strong>{money(annualTotal)}</strong><p>Based on active billing cycles</p></article>
            <article className={styles.pausedStat}><span>Paused</span><strong>{subscriptions.length - active.length}</strong><p>Not included in monthly total</p></article>
        </div>

        <div className={styles.workspace} id="subscriptions">
            <section className={styles.servicePanel}>
                <div className={styles.panelHeading}><div><h2>Your services</h2><p>Renewal dates are sorted from soonest to latest.</p></div><label className={styles.search}><FiSearch aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a service" aria-label="Search services" /></label></div>
                <div className={styles.filters} role="group" aria-label="Filter by billing status">{["All services", "Active", "Paused"].map((item) => <button type="button" key={item} className={filter === item ? styles.selectedFilter : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}<span>{item === "All services" ? subscriptions.length : subscriptions.filter((service) => service.status === item).length}</span></button>)}</div>
                <div className={styles.serviceList}>
                    <div className={styles.listLabels}><span>Service</span><span>Next renewal</span><span>Status</span><span>Price</span><span className={styles.actionsLabel}>Actions</span></div>
                    {visible.map((item) => {
                        const ServiceIcon = iconByCategory[item.category] || FiCreditCard;
                        const days = daysUntil(item.nextDate);
                        return <article className={styles.serviceRow} key={item.id}>
                            <div className={styles.serviceName}><span className={styles.serviceIcon + " " + styles[item.color]}><ServiceIcon aria-hidden="true" /></span><span><strong>{item.name}</strong><small>{item.detail}</small></span></div>
                            <div className={styles.renewal}><strong>{readableDate(item.nextDate)}</strong><small>{days < 0 ? "Date passed" : days === 0 ? "Due today" : days === 1 ? "Tomorrow" : "In " + days + " days"} · {item.cycle.toLowerCase()}</small></div>
                            <span className={item.status === "Active" ? styles.activeStatus : styles.pausedStatus}><i />{item.status}</span>
                            <div className={styles.price}><strong>{money(item.amount)}</strong><small>/{item.cycle === "Yearly" ? "year" : item.cycle === "Weekly" ? "week" : item.cycle === "Quarterly" ? "quarter" : "month"}</small></div>
                            <div className={styles.rowActions}><button type="button" aria-label={(item.status === "Active" ? "Pause " : "Resume ") + item.name} title={item.status === "Active" ? "Pause billing" : "Resume billing"} onClick={() => toggleStatus(item.id)}>{item.status === "Active" ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}</button><button type="button" className={styles.removeButton} aria-label={"Remove " + item.name} title="Remove service" onClick={() => setPendingDelete(item)}><FiTrash2 aria-hidden="true" /></button></div>
                        </article>;
                    })}
                    {visible.length === 0 && <p className={styles.empty}>No services match this view. Try another filter or add a subscription.</p>}
                </div>
                <p className={styles.localNote}>Your list is saved only in this browser.</p>
            </section>

            <aside className={styles.insights}>
                <section className={styles.upcomingCard}><div className={styles.asideHeading}><span className={styles.asideIcon}><FiCalendar aria-hidden="true" /></span><div><h2>Coming up</h2><p>Next three active renewals</p></div></div>
                    {upcoming.slice(0, 3).map((item) => <div className={styles.upcomingRow} key={item.id}><span className={styles.dateTile}><strong>{new Date(item.nextDate + "T12:00:00").getDate()}</strong><small>{new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(item.nextDate + "T12:00:00"))}</small></span><span className={styles.upcomingName}><strong>{item.name}</strong><small>{daysUntil(item.nextDate) === 0 ? "Today" : "In " + daysUntil(item.nextDate) + " days"}</small></span><strong className={styles.upcomingAmount}>{money(item.amount)}</strong></div>)}
                    {upcoming.length === 0 && <p className={styles.emptyUpcoming}>No active renewals to show.</p>}
                </section>
                <section className={styles.categoryCard}><div className={styles.asideHeading}><span className={styles.asideIcon}><FiCreditCard aria-hidden="true" /></span><div><h2>Monthly by category</h2><p>Estimated share of active plans</p></div></div>
                    {categories.map(([category, amount], index) => <div className={styles.categoryRow} key={category}><div><span>{category}</span><strong>{money(amount)}</strong></div><div className={styles.categoryTrack}><i style={{ width: Math.max(5, amount / Math.max(monthlyTotal, 1) * 100) + "%", backgroundColor: ["#93b83f", "#e49b5d", "#6487a2", "#967db1", "#d27d74"][index % 5] }} /></div></div>)}
                    {categories.length === 0 && <p className={styles.emptyUpcoming}>Add an active service to see your spending mix.</p>}
                </section>
                <p className={styles.disclaimer}>Monthly estimates convert weekly and yearly plans to a common view. Your actual charges follow each provider's billing terms.</p>
            </aside>
        </div>

        <form className={styles.addForm} id="add" onSubmit={addSubscription}>
            <div className={styles.formTitle}><span><FiPlus aria-hidden="true" /></span><div><h2>Add a subscription</h2><p>Keep the next charge and billing cycle close at hand.</p></div></div>
            <label>Service name<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Music plan" /></label>
            <label>Category<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}><option>Entertainment</option><option>Productivity</option><option>Storage</option><option>Reading</option><option>Wellness</option><option>Other</option></select></label>
            <label>Price<div className={styles.amountInput}><span>{String.fromCharCode(0x20b9)}</span><input required min="1" type="number" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} placeholder="0" /></div></label>
            <label>Billing cycle<select value={draft.cycle} onChange={(event) => setDraft({ ...draft, cycle: event.target.value })}><option>Monthly</option><option>Yearly</option><option>Quarterly</option><option>Weekly</option></select></label>
            <label>Next renewal<input required type="date" value={draft.nextDate} onChange={(event) => setDraft({ ...draft, nextDate: event.target.value })} /></label>
            <label>Plan note<input value={draft.detail} onChange={(event) => setDraft({ ...draft, detail: event.target.value })} placeholder="Optional" /></label>
            <button className={styles.submitButton} type="submit">Save service <FiPlus aria-hidden="true" /></button>
        </form>
        {pendingDelete && <ConfirmDialog title="Remove this subscription?" description={'"' + pendingDelete.name + '" will be removed from your renewal list.'} confirmLabel="Remove service" onCancel={() => setPendingDelete(null)} onConfirm={removeSubscription} />}
    </section>;
};

export default SubscriptionManager;
