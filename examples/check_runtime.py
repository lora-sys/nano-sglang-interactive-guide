import importlib.util
import platform
import sys

print("Python:", sys.version.split()[0])
print("Platform:", platform.platform())
print("sglang installed:", importlib.util.find_spec("sglang") is not None)
print("openai installed:", importlib.util.find_spec("openai") is not None)
print("Expected local server: http://127.0.0.1:30000")
