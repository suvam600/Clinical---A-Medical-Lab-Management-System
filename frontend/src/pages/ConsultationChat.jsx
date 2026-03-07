// src/pages/ConsultationChat.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

const API_BASE = "/api";

const BACKEND_ORIGIN =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : window.location.origin;

const SOCKET_URL = BACKEND_ORIGIN;

function getToken() {
  return localStorage.getItem("token") || "";
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function formatTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function isImageFile(fileType, fileUrl) {
  if (fileType === "image") return true;
  return /\.(png|jpe?g|webp)$/i.test(fileUrl || "");
}

function getFileHref(fileUrl) {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `${BACKEND_ORIGIN}${fileUrl}`;
}

export default function ConsultationChat() {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const currentUser = useMemo(() => getUser(), []);

  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sendingText, setSendingText] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [closingConsultation, setClosingConsultation] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const isDoctor = String(currentUser?.role || "").toLowerCase() === "doctor";

  const otherPartyName = useMemo(() => {
    if (!consultation) return isDoctor ? "Patient" : "Doctor";
    return isDoctor
      ? consultation?.patientId?.name || "Patient"
      : consultation?.doctorId?.name || "Doctor";
  }, [consultation, isDoctor]);

  const scrollToBottom = (behavior = "smooth") => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior });
    }, 50);
  };

  const appendMessageIfMissing = (newMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => String(m._id) === String(newMessage._id))) {
        return prev;
      }
      return [...prev, newMessage];
    });
  };

  const loadConsultation = async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/consultations/${consultationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const textRes = await res.text();
    let data = {};
    try {
      data = textRes ? JSON.parse(textRes) : {};
    } catch {
      data = {};
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to load consultation.");
    }

    setConsultation(data.data || null);
  };

  const loadMessages = async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/messages/${consultationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const textRes = await res.text();
    let data = {};
    try {
      data = textRes ? JSON.parse(textRes) : {};
    } catch {
      data = {};
    }

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to load messages.");
    }

    setMessages(Array.isArray(data.data) ? data.data : []);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);
        setError("");

        await loadConsultation();
        await loadMessages();

        if (!mounted) return;

        const socket = io(SOCKET_URL, {
          transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join_consultation", consultationId);
        });

        socket.on("receive_message", (incomingMessage) => {
          appendMessageIfMissing(incomingMessage);
          scrollToBottom();
        });

        socket.on("message_error", (payload) => {
          setError(payload?.message || "Failed to send message.");
        });
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to load consultation chat.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
          scrollToBottom("auto");
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.emit("leave_consultation", consultationId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [consultationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendTextMessage = async (e) => {
    e.preventDefault();

    const cleanText = text.trim();
    if (!cleanText) return;

    try {
      setSendingText(true);
      setError("");

      const token = getToken();

      const res = await fetch(`${API_BASE}/messages/${consultationId}/text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: cleanText }),
      });

      const textRes = await res.text();
      let data = {};
      try {
        data = textRes ? JSON.parse(textRes) : {};
      } catch {
        data = {};
      }

      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.message || "Failed to send message.");
      }

      if (socketRef.current) {
        socketRef.current.emit("send_message", {
          ...data.data,
          consultationId,
        });
      }

      appendMessageIfMissing(data.data);
      setText("");
      scrollToBottom();
    } catch (err) {
      setError(err.message || "Failed to send message.");
    } finally {
      setSendingText(false);
    }
  };

  const sendFileMessage = async () => {
    if (!selectedFile) return;

    try {
      setUploadingFile(true);
      setError("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const token = getToken();

      const res = await fetch(`${API_BASE}/messages/${consultationId}/file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const textRes = await res.text();
      let data = {};
      try {
        data = textRes ? JSON.parse(textRes) : {};
      } catch {
        data = {};
      }

      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.message || "Failed to upload file.");
      }

      if (socketRef.current) {
        socketRef.current.emit("send_message", {
          ...data.data,
          consultationId,
        });
      }

      appendMessageIfMissing(data.data);
      setSelectedFile(null);

      const input = document.getElementById("consultation-file-input");
      if (input) input.value = "";

      scrollToBottom();
    } catch (err) {
      setError(err.message || "Failed to upload file.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCloseConsultation = async () => {
    if (!isDoctor) return;

    try {
      setClosingConsultation(true);
      setError("");

      const token = getToken();

      const res = await fetch(
        `${API_BASE}/consultations/${consultationId}/close`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const textRes = await res.text();
      let data = {};
      try {
        data = textRes ? JSON.parse(textRes) : {};
      } catch {
        data = {};
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to close consultation.");
      }

      setConsultation(data.data || consultation);
    } catch (err) {
      setError(err.message || "Failed to close consultation.");
    } finally {
      setClosingConsultation(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <p className="text-sm text-slate-600">Loading consultation chat...</p>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 shadow-sm p-6">
          <p className="text-sm text-red-700">Consultation not found.</p>
          <button
            onClick={() => navigate(isDoctor ? "/doctor" : "/consult")}
            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isClosed = consultation?.status === "Closed";

  return (
    <div className="max-w-7xl">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                  Consultation chat
                </h1>
                <span
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
                    isClosed
                      ? "bg-slate-100 text-slate-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {consultation.status}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-600">
                Chat with <span className="font-semibold">{otherPartyName}</span>
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Consultation ID: {String(consultation._id).slice(-8).toUpperCase()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate(isDoctor ? "/doctor" : "/consult")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              >
                Back
              </button>

              {isDoctor ? (
                <button
                  onClick={handleCloseConsultation}
                  disabled={isClosed || closingConsultation}
                  className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {closingConsultation
                    ? "Closing..."
                    : isClosed
                    ? "Consultation closed"
                    : "Close consultation"}
                </button>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col h-[72vh] min-h-[560px]">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 bg-slate-50/40 flex justify-center">
              <div className="w-full max-w-3xl">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-slate-500">
                      No messages yet. Start the conversation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const mine =
                        String(msg.senderId) === String(currentUser.id) ||
                        String(msg.senderId?._id) === String(currentUser.id);

                      const fileHref = getFileHref(msg.fileUrl);

                      return (
                        <div
                          key={msg._id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`w-fit max-w-[78%] sm:max-w-[68%] rounded-2xl px-4 py-3 shadow-sm ${
                              mine
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-slate-200 text-slate-900"
                            }`}
                          >
                            <p
                              className={`text-[11px] font-semibold mb-1 ${
                                mine ? "text-blue-100" : "text-slate-500"
                              }`}
                            >
                              {mine
                                ? "You"
                                : msg.senderRole === "doctor"
                                ? "Doctor"
                                : "Patient"}
                            </p>

                            {msg.text ? (
                              <p className="text-sm whitespace-pre-wrap break-words leading-6">
                                {msg.text}
                              </p>
                            ) : null}

                            {msg.fileUrl ? (
                              <div className={msg.text ? "mt-3" : ""}>
                                {isImageFile(msg.fileType, msg.fileUrl) ? (
                                  <a
                                    href={fileHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={fileHref}
                                      alt="Uploaded report"
                                      className="max-h-72 w-auto rounded-xl border border-slate-200 object-contain bg-white"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={fileHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center rounded-xl px-3 py-2 text-sm underline ${
                                      mine ? "text-white" : "text-blue-700"
                                    }`}
                                  >
                                    Open PDF attachment
                                  </a>
                                )}
                              </div>
                            ) : null}

                            <p
                              className={`mt-2 text-[11px] ${
                                mine ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 px-4 sm:px-6 py-4 bg-white">
              {isClosed ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  This consultation is closed. No more messages can be sent.
                </div>
              ) : (
                <form onSubmit={sendTextMessage} className="flex flex-col gap-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder="Type your message..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none"
                  />

                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <input
                        id="consultation-file-input"
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="block text-sm text-slate-600"
                      />

                      <button
                        type="button"
                        onClick={sendFileMessage}
                        disabled={!selectedFile || uploadingFile}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {uploadingFile ? "Uploading..." : "Send attachment"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={sendingText || !text.trim()}
                      className="rounded-xl bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {sendingText ? "Sending..." : "Send message"}
                    </button>
                  </div>

                  {selectedFile ? (
                    <p className="text-xs text-slate-500">
                      Selected file:{" "}
                      <span className="font-medium text-slate-700">
                        {selectedFile.name}
                      </span>
                    </p>
                  ) : null}
                </form>
              )}
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 h-fit xl:sticky xl:top-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Consultation details
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-xs text-slate-500">
                {isDoctor ? "Patient name" : "Doctor name"}
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {otherPartyName}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-xs text-slate-500">Created</p>
              <p className="mt-1 font-semibold text-slate-900">
                {formatTime(consultation.createdAt) || "—"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-xs text-slate-500">Status</p>
              <p className="mt-1 font-semibold text-slate-900">
                {consultation.status}
              </p>
            </div>

            {isDoctor ? (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <p className="text-xs text-slate-500">Patient email</p>
                  <p className="mt-1 font-semibold text-slate-900 break-all">
                    {consultation?.patientId?.email || "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <p className="text-xs text-slate-500">Citizenship ID</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {consultation?.patientId?.citizenshipId || "—"}
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-xs text-slate-500">Doctor email</p>
                <p className="mt-1 font-semibold text-slate-900 break-all">
                  {consultation?.doctorId?.email || "—"}
                </p>
              </div>
            )}

            
          </div>
        </aside>
      </div>
    </div>
  );
}