# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import routes

app = FastAPI(
    title="Traffic Network Simulator",
    description="Congestion-aware routing simulation",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# "http://localhost:3000", "http://localhost:5173", "https://traffic-network-rerouting-git-4245a5-jaoharaligithubs-projects.vercel.app",
#                    "https://traffic-network-rerouting-model-benpk0byj.vercel.app",

app.include_router(routes.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Traffic Network Simulator API"}

@app.get("/health")
def health():
    return {"status": "healthy"}
