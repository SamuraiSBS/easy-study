import { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { CheckCircle2, ChevronRight, Loader2, Send, Star } from "lucide-react";
import { BottomNav } from "./components/BottomNav";
import { ServiceCard } from "./components/ServiceCard";
import { StatusBadge } from "./components/StatusBadge";
import { createOrder, createReview, getMyOrders, getReviews, getServices } from "./api";
import type { Screen } from "./screens";
import { getTelegramUser, getTelegramWebApp } from "./telegram";
import type { Order, Review, Service } from "./types";

const deadlineOptions = ["Завтра", "2-3 дня", "Неделя", "Указать в комментарии"];

type LoadState = "idle" | "loading" | "error";

export function App(): JSX.Element {
  const [screen, setScreen] = useState<Screen>("home");
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | "">("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState(deadlineOptions[1]);
  const [comment, setComment] = useState("");
  const [reviewOrderId, setReviewOrderId] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [submitState, setSubmitState] = useState<LoadState>("idle");
  const [error, setError] = useState("");

  const telegramUser = getTelegramUser();
  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId),
    [selectedServiceId, services],
  );

  useEffect(() => {
    const tg = getTelegramWebApp();
    tg?.ready();
    tg?.expand();
  }, []);

  useEffect(() => {
    setLoadState("loading");
    Promise.all([getServices(), getReviews()])
      .then(([serviceData, reviewData]) => {
        setServices(serviceData);
        setReviews(reviewData);
        if (serviceData.length > 0) {
          setSelectedServiceId(serviceData[0].id);
        }
        setLoadState("idle");
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
        setLoadState("error");
      });
  }, []);

  useEffect(() => {
    if (screen !== "orders") {
      return;
    }
    getMyOrders()
      .then(setOrders)
      .catch((requestError: Error) => setError(requestError.message));
  }, [screen]);

  function navigate(nextScreen: Screen): void {
    setError("");
    setScreen(nextScreen);
  }

  async function handleOrderSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!selectedServiceId) {
      setError("Выберите услугу");
      return;
    }
    setSubmitState("loading");
    setError("");
    try {
      await createOrder({
        service_id: Number(selectedServiceId),
        topic,
        subject: subject || undefined,
        deadline,
        comment: comment || undefined,
      });
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred("success");
      setTopic("");
      setSubject("");
      setComment("");
      setScreen("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось оформить заказ");
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred("error");
    } finally {
      setSubmitState("idle");
    }
  }

  async function handleReviewSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitState("loading");
    setError("");
    try {
      await createReview({
        rating,
        text: reviewText,
        order_id: reviewOrderId ? Number(reviewOrderId) : undefined,
      });
      setReviewOrderId("");
      setRating(5);
      setReviewText("");
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred("success");
      setError("Отзыв отправлен на модерацию");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось отправить отзыв");
    } finally {
      setSubmitState("idle");
    }
  }

  return (
    <div className="app-shell">
      <main className="content">
        {error && <div className="notice">{error}</div>}
        {loadState === "loading" && (
          <div className="loading">
            <Loader2 size={22} className="spin" aria-hidden="true" />
            Загрузка
          </div>
        )}

        {screen === "home" && (
          <section className="home-screen">
            <div className="hero">
              <div>
                <span className="eyebrow">Учебные работы на заказ</span>
                <h1>Easy Study</h1>
                <p>Выберите услугу, укажите тему и срок. Администратор напишет в Telegram для уточнения деталей.</p>
              </div>
              <button className="primary-button" type="button" onClick={() => navigate("order")}>
                Оформить заказ
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="quick-grid">
              <button type="button" onClick={() => navigate("services")}>
                <strong>{services.length}</strong>
                Услуг
              </button>
              <button type="button" onClick={() => navigate("reviews")}>
                <strong>{reviews.length}</strong>
                Отзывов
              </button>
            </div>

            <section className="section">
              <div className="section-title">
                <h2>Популярное</h2>
                <button type="button" onClick={() => navigate("services")}>
                  Все
                </button>
              </div>
              <div className="service-list">
                {services.slice(0, 3).map((service) => (
                  <ServiceCard key={service.id} service={service} compact />
                ))}
              </div>
            </section>
          </section>
        )}

        {screen === "services" && (
          <section className="section page">
            <div className="page-heading">
              <span className="eyebrow">Каталог</span>
              <h2>Услуги и цены</h2>
            </div>
            <div className="service-list">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={service.id === selectedServiceId}
                  onSelect={(nextService) => {
                    setSelectedServiceId(nextService.id);
                    navigate("order");
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {screen === "order" && (
          <section className="section page">
            <div className="page-heading">
              <span className="eyebrow">Новая заявка</span>
              <h2>Оформить заказ</h2>
              {telegramUser && <p>{telegramUser.first_name}, контакт будет взят из Telegram.</p>}
            </div>
            <form className="form" onSubmit={handleOrderSubmit}>
              <label>
                Услуга
                <select value={selectedServiceId} onChange={(event) => setSelectedServiceId(Number(event.target.value))}>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title} - от {service.price_from} ₽
                    </option>
                  ))}
                </select>
              </label>

              {selectedService && <ServiceCard service={selectedService} compact />}

              <label>
                Тема работы
                <input value={topic} onChange={(event) => setTopic(event.target.value)} required minLength={2} />
              </label>
              <label>
                Предмет или направление
                <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Например: история" />
              </label>
              <label>
                Срок выполнения
                <select value={deadline} onChange={(event) => setDeadline(event.target.value)}>
                  {deadlineOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Комментарий
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Объем, требования, файл можно отправить админу после заявки"
                  rows={4}
                />
              </label>
              <button className="primary-button full" type="submit" disabled={submitState === "loading"}>
                {submitState === "loading" ? <Loader2 size={20} className="spin" aria-hidden="true" /> : <Send size={20} aria-hidden="true" />}
                Оформить заказ
              </button>
            </form>
          </section>
        )}

        {screen === "success" && (
          <section className="success-screen">
            <CheckCircle2 size={54} aria-hidden="true" />
            <h2>Заявка принята</h2>
            <p>Администратор получил данные заказа и скоро напишет вам в Telegram.</p>
            <button className="primary-button full" type="button" onClick={() => navigate("orders")}>
              Мои заказы
            </button>
          </section>
        )}

        {screen === "orders" && (
          <section className="section page">
            <div className="page-heading">
              <span className="eyebrow">История</span>
              <h2>Мои заказы</h2>
            </div>
            <div className="order-list">
              {orders.length === 0 && <div className="empty-state">Заказов пока нет</div>}
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div>
                    <span className="order-id">#{order.id}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <h3>{order.service.title}</h3>
                  <p>{order.topic}</p>
                  <span>{order.deadline}</span>
                </article>
              ))}
            </div>
          </section>
        )}

        {screen === "reviews" && (
          <section className="section page">
            <div className="page-heading">
              <span className="eyebrow">Отзывы</span>
              <h2>Опыт студентов</h2>
            </div>
            <form className="form review-form" onSubmit={handleReviewSubmit}>
              <label>
                ID заказа
                <input
                  inputMode="numeric"
                  value={reviewOrderId}
                  onChange={(event) => setReviewOrderId(event.target.value)}
                  placeholder="Если есть"
                />
              </label>
              <div className="rating-group" aria-label="Оценка">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={value <= rating ? "star-button active" : "star-button"}
                    onClick={() => setRating(value)}
                    aria-label={`${value} из 5`}
                  >
                    <Star size={22} fill="currentColor" aria-hidden="true" />
                  </button>
                ))}
              </div>
              <label>
                Текст отзыва
                <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} required rows={3} />
              </label>
              <button className="primary-button full" type="submit" disabled={submitState === "loading"}>
                Отправить отзыв
              </button>
            </form>

            <div className="review-list">
              {reviews.length === 0 && <div className="empty-state">Одобренных отзывов пока нет</div>}
              {reviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <div className="stars">{"★".repeat(review.rating)}</div>
                  <p>{review.text}</p>
                  <span>{review.first_name || review.username || "Студент"}</span>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
      <BottomNav active={screen === "success" ? "order" : screen} onChange={navigate} />
    </div>
  );
}
