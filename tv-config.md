# 55" Portrait TV Configuration Guide

## Hardware Requirements

### TV Setup
- **TV**: 55-inch LED TV (1920x1080 or 2560x1440 recommended)
- **Orientation**: Portrait mode (rotated 90 degrees)
- **Input**: HDMI or DisplayPort connection
- **Touch**: Optional touch overlay for interactive experience

### Computer Requirements
- **OS**: Windows 10/11, macOS, or Linux
- **Browser**: Chrome, Firefox, or Edge (latest version)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space
- **Internet**: Stable broadband connection for AI processing

## Display Configuration

### Browser Settings
1. **Fullscreen Mode**: Press F11 or use browser's fullscreen option
2. **Zoom Level**: Set to 100% (Ctrl+0)
3. **Developer Tools**: Disable (F12) for production use

### TV Display Settings
1. **Aspect Ratio**: Set to "Just Scan" or "1:1 Pixel Mapping"
2. **Overscan**: Disable to prevent cropping
3. **Sharpness**: Set to 50-60% for optimal text clarity
4. **Color Temperature**: Warm or Standard for better viewing

## Application Optimizations

### CSS Classes Added
- `.portrait-grid`: Single column layout for portrait orientation
- Large display media queries for 1920px+ width
- Touch-friendly button sizes (minimum 44px)
- Increased font sizes for better readability

### Performance Tips
1. **Hardware Acceleration**: Enable in browser settings
2. **GPU Acceleration**: Ensure graphics drivers are updated
3. **Memory Management**: Close unnecessary applications
4. **Network**: Use wired connection for stable AI processing

## Deployment Steps

### 1. Build Production Version
```bash
npm run build
```

### 2. Serve Application
```bash
# Using serve (install with: npm install -g serve)
serve -s build -l 3000

# Or using Python
python -m http.server 3000 --directory build
```

### 3. Access on TV
- Connect computer to TV via HDMI
- Open browser on computer
- Navigate to `http://localhost:3000`
- Enter fullscreen mode (F11)

### 4. Auto-start Setup (Windows)
Create a batch file (`start-booth.bat`):
```batch
@echo off
cd /d "C:\path\to\your\project"
start chrome --kiosk --app=http://localhost:3000
```

## Touch Interface (Optional)

### Touch Overlay Setup
- **Capacitive Touch Overlay**: 55" IR touch frame
- **Driver Installation**: Follow manufacturer instructions
- **Calibration**: Use Windows touch calibration tool
- **Multi-touch**: Ensure 10-point touch support

### Touch Optimization
- All buttons are minimum 44px height
- Spacing between elements increased
- Touch feedback animations added
- Gesture support for navigation

## Troubleshooting

### Common Issues
1. **Display Not Filling Screen**: Check TV aspect ratio settings
2. **Text Too Small**: CSS optimizations should handle this automatically
3. **Touch Not Working**: Verify touch overlay drivers
4. **Performance Issues**: Check hardware acceleration settings

### Performance Monitoring
- Monitor CPU usage during AI processing
- Check memory usage with browser dev tools
- Monitor network speed for API calls
- Use browser's performance tab for optimization

## Maintenance

### Regular Tasks
- Clean TV screen weekly
- Update browser monthly
- Check for application updates
- Monitor system performance
- Backup configuration settings

### Backup Strategy
- Keep backup of build files
- Document TV settings
- Save browser configuration
- Maintain network settings backup 