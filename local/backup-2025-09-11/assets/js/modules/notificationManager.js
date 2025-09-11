/**
 * Notification Manager Module
 * Provides toast notifications for storage operations and other feedback
 */

const NotificationManager = {
    container: null,
    notificationCount: 0,

    /**
     * Initialize the Notification Manager
     */
    init() {
        this.container = document.getElementById('notification-container');
        if (!this.container) {
            console.warn('Notification container not found');
            return false;
        }
        console.log('✅ NotificationManager initialized');
        return true;
    },

    /**
     * Show a notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type: 'success', 'error', 'info', 'warning'
     * @param {number} duration - Duration in milliseconds (0 = no auto-dismiss)
     */
    show(message, type = 'info', duration = 3000) {
        if (!this.container) {
            console.warn('NotificationManager not initialized');
            return;
        }

        this.notificationCount++;
        const notificationId = `notification-${this.notificationCount}`;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.style.cssText = `
            background: ${this.getBackgroundColor(type)};
            color: ${this.getTextColor(type)};
            border: 1px solid ${this.getBorderColor(type)};
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.4;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: all 0.3s ease;
            pointer-events: auto;
            max-width: 100%;
            word-wrap: break-word;
            position: relative;
        `;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 4px;
            right: 8px;
            background: none;
            border: none;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            color: inherit;
            opacity: 0.7;
            line-height: 1;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onclick = () => this.remove(notificationId);
        
        // Add icon and message
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; padding-right: 24px;">
                <span style="margin-right: 8px; font-size: 16px; flex-shrink: 0;">${this.getIcon(type)}</span>
                <span style="flex: 1;">${message}</span>
            </div>
        `;
        notification.appendChild(closeBtn);

        // Add to container
        this.container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto-dismiss if duration > 0
        if (duration > 0) {
            setTimeout(() => this.remove(notificationId), duration);
        }

        return notificationId;
    },

    /**
     * Remove a notification
     * @param {string} notificationId - Notification ID to remove
     */
    remove(notificationId) {
        const notification = document.getElementById(notificationId);
        if (!notification) return;

        // Animate out
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    },

    /**
     * Show success notification
     * @param {string} message - Success message
     * @param {number} duration - Duration in milliseconds
     */
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },

    /**
     * Show error notification
     * @param {string} message - Error message
     * @param {number} duration - Duration in milliseconds (0 = no auto-dismiss)
     */
    error(message, duration = 0) {
        return this.show(message, 'error', duration);
    },

    /**
     * Show info notification
     * @param {string} message - Info message
     * @param {number} duration - Duration in milliseconds
     */
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    },

    /**
     * Show warning notification
     * @param {string} message - Warning message
     * @param {number} duration - Duration in milliseconds
     */
    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    },

    /**
     * Get background color for notification type
     */
    getBackgroundColor(type) {
        const colors = {
            success: '#d4edda',
            error: '#f8d7da',
            warning: '#fff3cd',
            info: '#d1ecf1'
        };
        return colors[type] || colors.info;
    },

    /**
     * Get text color for notification type
     */
    getTextColor(type) {
        const colors = {
            success: '#155724',
            error: '#721c24',
            warning: '#856404',
            info: '#0c5460'
        };
        return colors[type] || colors.info;
    },

    /**
     * Get border color for notification type
     */
    getBorderColor(type) {
        const colors = {
            success: '#c3e6cb',
            error: '#f5c6cb',
            warning: '#ffeaa7',
            info: '#bee5eb'
        };
        return colors[type] || colors.info;
    },

    /**
     * Get icon for notification type
     */
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    },

    /**
     * Clear all notifications
     */
    clear() {
        if (!this.container) return;
        this.container.innerHTML = '';
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationManager.init());
} else {
    NotificationManager.init();
}

// Make globally available
window.NotificationManager = NotificationManager;