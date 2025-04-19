// super-admin-dashboard-charts.js

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Sample data for charts - in production this would come from your backend
    const monthlyData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        examCount: [42, 38, 65, 70, 55, 43, 60, 75, 80, 98, 83, 90],
        studentActivity: [150, 135, 210, 250, 280, 230, 300, 350, 400, 450, 420, 460]
    };

    const userTypeData = {
        labels: ['Students', 'Teachers', 'Admins', 'Super Admins'],
        counts: [4500, 320, 156, 8],
        colors: ['#4361ee', '#ff006e', '#3a86ff', '#fb5607']
    };

    const subjectData = {
        labels: ['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Physics', 'Chemistry', 'Biology'],
        examCounts: [345, 290, 310, 140, 180, 220, 210, 195],
        colors: [
            'rgba(67, 97, 238, 0.7)',
            'rgba(255, 0, 110, 0.7)',
            'rgba(58, 134, 255, 0.7)',
            'rgba(251, 86, 7, 0.7)',
            'rgba(76, 201, 240, 0.7)',
            'rgba(131, 56, 236, 0.7)',
            'rgba(58, 12, 163, 0.7)',
            'rgba(255, 190, 11, 0.7)'
        ]
    };

    const performanceData = {
        labels: ['Royal College', 'Visakha Vidyalaya', 'Ananda College', 'Devi Balika', 'St. Thomas', 'Isipathana', 'Mahanama', 'Nalanda'],
        avgScores: [85, 88, 82, 90, 79, 81, 84, 83],
        examCounts: [120, 110, 105, 95, 100, 90, 95, 100]
    };

    // Create or get chart containers
    createChartContainers();

    // Initialize all charts
    initMonthlyActivityChart(monthlyData);
    initUserDistributionChart(userTypeData);
    initSubjectDistributionChart(subjectData);
    initSchoolPerformanceChart(performanceData);

    // Add chart containers to the dashboard content
    function createChartContainers() {
        // Get the dashboard content element
        const dashboardContent = document.getElementById('dashboardContent');

        // Check if charts container already exists
        if (!document.getElementById('chartsContainer')) {
            // Create new row for charts
            const chartsContainer = document.createElement('div');
            chartsContainer.id = 'chartsContainer';
            chartsContainer.className = 'row mb-4';

            // Monthly Activity Chart
            const monthlyChartCol = document.createElement('div');
            monthlyChartCol.className = 'col-lg-8 col-md-12 mb-4';
            monthlyChartCol.innerHTML = `
                <div class="chart-card">
                    <div class="chart-card-header">
                        <h3 class="chart-title">Monthly Activity</h3>
                    </div>
                    <div class="chart-body">
                        <canvas id="monthlyActivityChart"></canvas>
                    </div>
                </div>
            `;

            // User Distribution Chart
            const userDistributionCol = document.createElement('div');
            userDistributionCol.className = 'col-lg-4 col-md-12 mb-4';
            userDistributionCol.innerHTML = `
                <div class="chart-card">
                    <div class="chart-card-header">
                        <h3 class="chart-title">User Distribution</h3>
                    </div>
                    <div class="chart-body">
                        <canvas id="userDistributionChart"></canvas>
                    </div>
                </div>
            `;

            // Subject Distribution Chart
            const subjectDistributionCol = document.createElement('div');
            subjectDistributionCol.className = 'col-lg-6 col-md-12 mb-4';
            subjectDistributionCol.innerHTML = `
                <div class="chart-card">
                    <div class="chart-card-header">
                        <h3 class="chart-title">Exams by Subject</h3>
                    </div>
                    <div class="chart-body">
                        <canvas id="subjectDistributionChart"></canvas>
                    </div>
                </div>
            `;

            // School Performance Chart
            const schoolPerformanceCol = document.createElement('div');
            schoolPerformanceCol.className = 'col-lg-6 col-md-12 mb-4';
            schoolPerformanceCol.innerHTML = `
                <div class="chart-card">
                    <div class="chart-card-header">
                        <h3 class="chart-title">Top School Performance</h3>
                    </div>
                    <div class="chart-body">
                        <canvas id="schoolPerformanceChart"></canvas>
                    </div>
                </div>
            `;

            // Append all columns to the charts container
            chartsContainer.appendChild(monthlyChartCol);
            chartsContainer.appendChild(userDistributionCol);
            chartsContainer.appendChild(subjectDistributionCol);
            chartsContainer.appendChild(schoolPerformanceCol);

            // Insert charts container after stats cards
            const statsCards = document.getElementById('statsCards');
            if (statsCards && statsCards.nextSibling) {
                dashboardContent.insertBefore(chartsContainer, statsCards.nextSibling);
            } else {
                dashboardContent.appendChild(chartsContainer);
            }
        }
    }

    // Initialize Monthly Activity Chart (Line Chart)
    function initMonthlyActivityChart(data) {
        const ctx = document.getElementById('monthlyActivityChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Exams Created',
                        data: data.examCount,
                        borderColor: '#4361ee',
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#4361ee',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Student Activity',
                        data: data.studentActivity,
                        borderColor: '#ff006e',
                        backgroundColor: 'rgba(255, 0, 110, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#ff006e',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Initialize User Distribution Chart (Doughnut Chart)
    function initUserDistributionChart(data) {
        const ctx = document.getElementById('userDistributionChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.counts,
                    backgroundColor: data.colors,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }

    // Initialize Subject Distribution Chart (Bar Chart)
    function initSubjectDistributionChart(data) {
        const ctx = document.getElementById('subjectDistributionChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Number of Exams',
                    data: data.examCounts,
                    backgroundColor: data.colors,
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Initialize School Performance Chart (Bubble Chart)
    function initSchoolPerformanceChart(data) {
        const ctx = document.getElementById('schoolPerformanceChart').getContext('2d');

        // Create dataset with bubble sizes based on exam counts
        const bubbleData = data.labels.map((label, index) => {
            return {
                x: index,
                y: data.avgScores[index],
                r: data.examCounts[index] / 10  // Size proportional to exam count
            };
        });

        new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [{
                    label: 'School Performance',
                    data: bubbleData,
                    backgroundColor: 'rgba(58, 134, 255, 0.7)',
                    borderColor: 'rgba(58, 134, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 70,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Average Score (%)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        type: 'category',
                        labels: data.labels,
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                return [
                                    `School: ${data.labels[index]}`,
                                    `Average Score: ${data.avgScores[index]}%`,
                                    `Exams Taken: ${data.examCounts[index]}`
                                ];
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
});