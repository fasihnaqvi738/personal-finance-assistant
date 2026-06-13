import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard({ setIsLoggedIn }) {
    const [expenses, setExpenses] = useState([]);
    const [name, setName] = useState("");
    const [categories, setCategories] = useState([]);
    const [editingExpense, setEditingExpense] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editAmount, setEditAmount] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState("");
    const [deleteCategory, setDeleteCategory] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [expenseTitle, setExpenseTitle] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState("");
    const [chatHistory, setChatHistory] = useState([
        {
            role: "assistant",
            text: "Ask me about your spending, biggest expenses, category totals, or saving suggestions.",
        },
    ]);

    const handleSendChat = async () => {
        if (!chatMessage.trim()) return;

        const userMessage = chatMessage.trim();

        setChatHistory((prev) => [
            ...prev,
            { role: "user", text: userMessage },
        ]);

        setChatMessage("");
        setChatLoading(true);

        try {
            const token = localStorage.getItem("token");
            console.log("Token:", token);
            const response = await api.post(
                "/chat",
                {
                    message: userMessage,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setChatHistory((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: response.data.answer,
                    sources: response.data.sources || [],
                },
            ]);
        } catch (error) {
            console.log("STATUS:", error.response?.status);
            console.log("DATA:", error.response?.data);
            console.log("FULL:", error.response);
            console.error("Chat failed:", error.response?.data || error);

            setChatHistory((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text: "I could not fetch insights right now. Please try again.",
                },
            ]);
        } finally {
            setChatLoading(false);
        }
    };

    const [chatLoading, setChatLoading] = useState(false);

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
    }, []);

    const getDisplayName = () => {
        const savedUsername = localStorage.getItem("username") || localStorage.getItem("name");
        if (savedUsername) return savedUsername;

        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                if (user.username) return user.username;
                if (user.name) return user.name;
                if (user.email) return user.email;
            } catch (error) {
                if (savedUser.trim()) return savedUser;
            }
        }

        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                return payload.username || payload.name || payload.email || `User ${payload.sub || payload.user_id || ""}`.trim();
            } catch (error) {
                return "Dashboard";
            }
        }

        return "Dashboard";
    };

    const formatAmount = (amount) => {
        const value = Number(amount || 0);

        return value.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
        });
    };

    const formatDate = (date) => {
        if (!date) return "No date";

        return new Date(date).toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getCategoryExpenses = (categoryId) =>
        expenses.filter((expense) => Number(expense.category) === Number(categoryId));

    const handleOpenAddExpense = (cat) => {
        setSelectedCategory(cat);
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await api.get("/categories", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setCategories(res.data);
        } catch (err) {
            console.error("Category fetch failed:", err);
        }
    };

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await api.get("/expenses", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setExpenses(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                setIsLoggedIn(false);
                return;
            }

            console.error("Fetch failed:", error);
            console.error("Fetch failed:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
        window.location.reload();
    };

    const handleAddCategory = async () => {
        if (!name.trim()) return;

        try {
            const token = localStorage.getItem("token");

            await api.post(
                "/categories",
                { name },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setName("");
            fetchCategories();
        } catch (err) {
            console.log(err);
        }
    };

    const handleEditCategory = (cat) => {
        setEditingCategory(cat);
        setEditCategoryName(cat.name);
    };

    const handleUpdateCategory = async () => {
        if (!editCategoryName.trim()) return;

        try {
            const token = localStorage.getItem("token");

            await api.patch(
                `/categories/${editingCategory.id}`,
                { name: editCategoryName },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setEditingCategory(null);
            setEditCategoryName("");
            fetchCategories();
        } catch (err) {
            console.log(err);
        }
    };

    const handleAddExpense = async () => {
        try {
            const token = localStorage.getItem("token");

            await api.post(
                "/expenses",
                {
                    title: expenseTitle,
                    amount: parseFloat(expenseAmount),
                    category: Number(selectedCategory.id),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setSelectedCategory(null);
            setExpenseTitle("");
            setExpenseAmount("");
            fetchExpenses();
        } catch (error) {
            console.log(error.response?.data);
            console.error("Expense add failed:", error);
        }
    };

    const handleDeleteExpense = async (id) => {
        try {
            const token = localStorage.getItem("token");

            await api.delete(`/expenses/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setExpenses((prev) => prev.filter((expense) => expense.id !== id));
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleEditExpense = (expense) => {
        setEditingExpense(expense);
        setEditTitle(expense.title);
        setEditAmount(expense.amount);
        setEditCategory(expense.category);
    };

    const handleConfirmDeleteCategory = async () => {
        try {
            const token = localStorage.getItem("token");

            await api.delete(`/categories/${deleteCategory.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setDeleteCategory(null);
            fetchCategories();
        } catch (error) {
            console.error("Category delete failed:", error);
        }
    };

    const handleUpdate = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await api.patch(
                `/expenses/${editingExpense.id}`,
                {
                    title: editTitle,
                    amount: parseFloat(editAmount),
                    category: Number(editCategory),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setExpenses((prev) =>
                prev.map((exp) => (exp.id === editingExpense.id ? response.data : exp))
            );

            setEditingExpense(null);
        } catch (error) {
            console.error("Update failed:", error);
            console.log(error.response?.data);
        }
    };

    const styles = {
        page: {
            minHeight: "100vh",
            background: "linear-gradient(135deg, #07111f 0%, #101827 45%, #13251f 100%)",
            color: "#e5edf5",
            padding: "28px",
            fontFamily: "Inter, Segoe UI, Arial, sans-serif",
        },
        topBar: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "28px",
        },
        username: {
            margin: 0,
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: 0,
        },
        subtitle: {
            margin: "6px 0 0",
            color: "#8ea0b5",
            fontSize: "14px",
        },
        logoutButton: {
            background: "#ef4444",
            border: "1px solid #f87171",
            color: "white",
            borderRadius: "8px",
            padding: "10px 16px",
            cursor: "pointer",
            fontWeight: 700,
        },
        toolbar: {
            display: "flex",
            gap: "10px",
            alignItems: "center",
            background: "rgba(15, 23, 42, 0.76)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            borderRadius: "8px",
            padding: "14px",
            marginBottom: "22px",
            boxShadow: "0 18px 48px rgba(0, 0, 0, 0.22)",
        },
        input: {
            background: "#0f172a",
            border: "1px solid #314158",
            color: "#e5edf5",
            borderRadius: "8px",
            padding: "10px 12px",
            outline: "none",
            minHeight: "20px",
        },
        primaryButton: {
            background: "#14b8a6",
            border: "1px solid #2dd4bf",
            color: "#031312",
            borderRadius: "8px",
            padding: "10px 14px",
            cursor: "pointer",
            fontWeight: 800,
        },
        ghostButton: {
            background: "rgba(15, 23, 42, 0.88)",
            border: "1px solid #334155",
            color: "#dbeafe",
            borderRadius: "8px",
            padding: "8px 10px",
            cursor: "pointer",
            fontWeight: 700,
        },
        dangerSmall: {
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(248, 113, 113, 0.7)",
            color: "#fecaca",
            borderRadius: "8px",
            padding: "8px 10px",
            cursor: "pointer",
            fontWeight: 800,
        },
        grid: {
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "16px",
            alignItems: "stretch",
        },
        card: {
            background: "rgba(15, 23, 42, 0.82)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            borderRadius: "8px",
            padding: "16px",
            minWidth: 0,
            height: "360px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 20px 52px rgba(0, 0, 0, 0.22)",
        },
        cardHeader: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "12px",
        },
        categoryTitle: {
            margin: 0,
            fontSize: "20px",
            fontWeight: 800,
            color: "#f8fafc",
        },
        categoryMeta: {
            margin: "4px 0 0",
            color: "#8ea0b5",
            fontSize: "13px",
        },
        expenseList: {
            flex: 1,
            overflowY: "scroll",
            paddingRight: "10px",
            scrollbarColor: "#1e293b #020617",
            scrollbarWidth: "thin",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
        },
        expenseRow: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(2, 6, 23, 0.58)",
            border: "1px solid rgba(148, 163, 184, 0.14)",
            borderRadius: "8px",
            padding: "9px",
            minHeight: "40px",
        },
        expenseText: {
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "14px",
        },
        amount: {
            color: "#86efac",
            fontWeight: 800,
        },
        timestamp: {
            color: "#93a4b8",
            fontSize: "12px",
        },
        iconButton: {
            background: "#111827",
            border: "1px solid #334155",
            color: "#e5edf5",
            borderRadius: "8px",
            padding: "7px 9px",
            cursor: "pointer",
            fontWeight: 800,
            flex: "0 0 auto",
        },
        cardActions: {
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            paddingTop: "12px",
            marginTop: "12px",
            borderTop: "1px solid rgba(148, 163, 184, 0.14)",
        },
        overlay: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(2, 6, 23, 0.76)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 10,
        },
        modal: {
            background: "#0f172a",
            color: "#e5edf5",
            padding: "22px",
            borderRadius: "8px",
            border: "1px solid rgba(148, 163, 184, 0.22)",
            minWidth: "320px",
            maxWidth: "760px",
            width: "min(760px, 100%)",
            boxShadow: "0 26px 80px rgba(0, 0, 0, 0.45)",
        },
        modalTitle: {
            margin: "0 0 14px",
            fontSize: "22px",
            fontWeight: 800,
        },
        modalList: {
            maxHeight: "56vh",
            overflowY: "scroll",
            scrollbarColor: "#1e293b #020617",
            scrollbarWidth: "thin",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "16px",
        },
        modalActions: {
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "16px",
        },
        formStack: {
            display: "flex",
            flexDirection: "column",
            gap: "12px",
        },
    };

    const renderExpenseRow = (expense) => (
        <div key={expense.id} style={styles.expenseRow}>
            <span style={styles.expenseText} title={`${expense.title} - ${formatDate(expense.date)}`}>
                <strong>{expense.title}</strong> <span style={styles.amount}>Rs. {formatAmount(expense.amount)}</span>{" "}
                <span style={styles.timestamp}>{formatDate(expense.date)}</span>
            </span>

            <button style={styles.iconButton} onClick={() => handleEditExpense(expense)}>
                Edit
            </button>

            <button style={styles.dangerSmall} onClick={() => handleDeleteExpense(expense.id)}>
                x
            </button>
        </div>
    );

    const displayName = getDisplayName();

    return (
        <div style={styles.page}>
            <style>{`
                .dashboard-category-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }

                .dashboard-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #1e293b #020617;
                }

                .dashboard-scrollbar::-webkit-scrollbar {
                    width: 10px;
                }

                .dashboard-scrollbar::-webkit-scrollbar-track {
                    background: #020617;
                    border-radius: 8px;
                }

                .dashboard-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 8px;
                    border: 2px solid #020617;
                }

                .dashboard-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }

                @media (max-width: 1100px) {
                    .dashboard-category-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }

                @media (max-width: 720px) {
                    .dashboard-category-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
            <div style={styles.topBar}>
                <div>
                    <h1 style={styles.username}>{displayName}</h1>
                    <p style={styles.subtitle}>Track spending by category and keep every expense within reach.</p>
                </div>

                <button style={styles.logoutButton} onClick={handleLogout}>
                    Logout
                </button>
            </div>

            <div style={styles.toolbar}>
                <input
                    style={{ ...styles.input, flex: 1 }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Category name"
                />

                <button style={styles.primaryButton} onClick={handleAddCategory}>
                    Add Category
                </button>
            </div>

            <div className="dashboard-category-grid" style={styles.grid}>
                {categories.map((cat) => {
                    const categoryExpenses = getCategoryExpenses(cat.id);
                    const total = categoryExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

                    return (
                        <div key={cat.id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div>
                                    <h4 style={styles.categoryTitle}>{cat.name}</h4>
                                    <p style={styles.categoryMeta}>
                                        {categoryExpenses.length} expenses - Rs. {formatAmount(total)}
                                    </p>
                                </div>

                                <button style={styles.iconButton} onClick={() => setExpandedCategory(cat)}>
                                    Expand
                                </button>
                            </div>

                            <div className="dashboard-scrollbar" style={styles.expenseList}>
                                {categoryExpenses.length ? (
                                    categoryExpenses.map(renderExpenseRow)
                                ) : (
                                    <p style={styles.categoryMeta}>No expenses yet.</p>
                                )}
                            </div>

                            <div style={styles.cardActions}>
                                <button style={styles.primaryButton} onClick={() => handleOpenAddExpense(cat)}>
                                    Add Expense
                                </button>

                                <button style={styles.ghostButton} onClick={() => handleEditCategory(cat)}>
                                    Edit Category
                                </button>

                                <button style={styles.dangerSmall} onClick={() => setDeleteCategory(cat)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {expandedCategory && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>{expandedCategory.name}</h3>

                        <div className="dashboard-scrollbar" style={styles.modalList}>
                            {getCategoryExpenses(expandedCategory.id).length ? (
                                getCategoryExpenses(expandedCategory.id).map(renderExpenseRow)
                            ) : (
                                <p style={styles.categoryMeta}>No expenses in this category yet.</p>
                            )}
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.primaryButton} onClick={() => handleOpenAddExpense(expandedCategory)}>
                                Add Expense
                            </button>

                            <button style={styles.ghostButton} onClick={() => setExpandedCategory(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingCategory && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>Edit Category</h3>

                        <div style={styles.formStack}>
                            <input
                                style={styles.input}
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                            />
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.primaryButton} onClick={handleUpdateCategory}>
                                Update
                            </button>

                            <button
                                style={styles.ghostButton}
                                onClick={() => {
                                    setEditingCategory(null);
                                    setEditCategoryName("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteCategory && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>Delete Category</h3>

                        <p style={styles.subtitle}>
                            Are you sure you want to delete <strong>{deleteCategory.name}</strong>?
                        </p>

                        <div style={styles.modalActions}>
                            <button style={styles.dangerSmall} onClick={handleConfirmDeleteCategory}>
                                Delete
                            </button>

                            <button style={styles.ghostButton} onClick={() => setDeleteCategory(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedCategory && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>Add Expense</h3>

                        <p style={styles.subtitle}>
                            Category: <strong>{selectedCategory.name}</strong>
                        </p>

                        <div style={styles.formStack}>
                            <input
                                style={styles.input}
                                placeholder="Expense Title"
                                value={expenseTitle}
                                onChange={(e) => setExpenseTitle(e.target.value)}
                            />

                            <input
                                style={styles.input}
                                type="number"
                                placeholder="Amount"
                                value={expenseAmount}
                                onChange={(e) => setExpenseAmount(e.target.value)}
                            />
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.primaryButton} onClick={handleAddExpense}>
                                Add
                            </button>

                            <button
                                style={styles.ghostButton}
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setExpenseTitle("");
                                    setExpenseAmount("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingExpense && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>Edit Expense</h3>

                        <div style={styles.formStack}>
                            <input
                                style={styles.input}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Title"
                            />

                            <input
                                style={styles.input}
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                placeholder="Amount"
                                type="number"
                            />

                            <input
                                style={styles.input}
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                placeholder="Category ID"
                            />
                        </div>

                        <div style={styles.modalActions}>
                            <button style={styles.primaryButton} onClick={handleUpdate}>
                                Update
                            </button>

                            <button style={styles.ghostButton} onClick={() => setEditingExpense(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <button
                style={{
                    position: "fixed",
                    right: "28px",
                    bottom: "28px",
                    background: "#14b8a6",
                    border: "1px solid #2dd4bf",
                    color: "#031312",
                    borderRadius: "8px",
                    padding: "14px 18px",
                    cursor: "pointer",
                    fontWeight: 900,
                    boxShadow: "0 18px 42px rgba(0,0,0,0.35)",
                    zIndex: 9,
                }}
                onClick={() => setChatOpen(true)}
            >
                Insights
            </button>

            {chatOpen && (
                <div style={styles.overlay}>
                    <div style={{ ...styles.modal, maxWidth: "680px" }}>
                        <h3 style={styles.modalTitle}>Finance Insights</h3>

                        <div
                            style={{
                                maxHeight: "420px",
                                overflowY: "auto",
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                                marginBottom: "14px",
                            }}
                        >
                            {chatHistory.map((msg, index) => (
                                <div
                                    key={index}
                                    style={{
                                        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                        background: msg.role === "user" ? "#14b8a6" : "#020617",
                                        color: msg.role === "user" ? "#031312" : "#e5edf5",
                                        border: "1px solid rgba(148, 163, 184, 0.2)",
                                        borderRadius: "8px",
                                        padding: "10px 12px",
                                        maxWidth: "85%",
                                        whiteSpace: "pre-line",
                                        fontSize: "14px",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {msg.text}
                                </div>
                            ))}

                            {chatLoading && (
                                <div style={styles.categoryMeta}>
                                    Thinking...
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <input
                                style={{ ...styles.input, flex: 1 }}
                                value={chatMessage}
                                placeholder="Ask about your expenses..."
                                onChange={(e) => setChatMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSendChat();
                                }}
                            />

                            <button style={styles.primaryButton} onClick={handleSendChat}>
                                Send
                            </button>

                            <button style={styles.ghostButton} onClick={() => setChatOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;